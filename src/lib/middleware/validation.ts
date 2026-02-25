/**
 * リクエストバリデーションミドルウェア
 * Zodスキーマによるバリデーション、バリデーションエラーの整形
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodSchema, type ZodError } from 'zod';
import { ApiError, ApiErrorCode } from './error';

/** バリデーションエラーの詳細 */
export type ValidationErrorDetail = {
  path: string;
  message: string;
};

/**
 * Zodエラーをフラット化して整形
 */
export function formatZodError(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function createValidationErrorResponse(
  errors: ValidationErrorDetail[]
): NextResponse {
  const firstError = errors[0];
  const message = firstError ? firstError.message : '入力値が不正です';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_ERROR,
        message,
        details: { errors },
      },
    },
    { status: 422 }
  );
}

/**
 * リクエストボディのバリデーション結果
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * リクエストボディをバリデーション
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = formatZodError(result.error);
      return {
        success: false,
        response: createValidationErrorResponse(errors),
      };
    }

    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: ApiErrorCode.BAD_REQUEST,
            message: '無効なJSONフォーマットです',
          },
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * クエリパラメータをバリデーション
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const result = schema.safeParse(searchParams);

  if (!result.success) {
    const errors = formatZodError(result.error);
    return {
      success: false,
      response: createValidationErrorResponse(errors),
    };
  }

  return { success: true, data: result.data };
}

/**
 * URLパスパラメータをバリデーション
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = formatZodError(result.error);
    return {
      success: false,
      response: createValidationErrorResponse(errors),
    };
  }

  return { success: true, data: result.data };
}

/**
 * バリデーション結果をAPIエラーに変換（throw用）
 */
export function validateOrThrow<T>(data: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = formatZodError(result.error);
    const firstError = errors[0];
    throw new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      firstError ? firstError.message : '入力値が不正です',
      { errors }
    );
  }

  return result.data;
}

/**
 * IDパラメータ用スキーマ
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('IDは正の整数で指定してください'),
});

export type IdParam = z.infer<typeof idParamSchema>;

/**
 * IDパラメータをバリデーション
 */
export function validateIdParam(
  params: { id?: string | string[] }
): ValidationResult<{ id: number }> {
  return validatePathParams({ id: params.id }, idParamSchema);
}

/**
 * 複数IDパラメータ用スキーマ
 */
export const reportIdParamSchema = z.object({
  reportId: z.coerce.number().int().positive('IDは正の整数で指定してください'),
});

export const visitIdParamSchema = z.object({
  visitId: z.coerce.number().int().positive('IDは正の整数で指定してください'),
});

/**
 * Content-Typeをチェック
 */
export function validateContentType(
  request: NextRequest,
  expectedType = 'application/json'
): boolean {
  const contentType = request.headers.get('Content-Type');
  return contentType?.includes(expectedType) ?? false;
}

/**
 * Content-Typeチェック付きバリデーション
 */
export async function validateJsonRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  if (!validateContentType(request)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: {
            code: ApiErrorCode.BAD_REQUEST,
            message: 'Content-Type must be application/json',
          },
        },
        { status: 400 }
      ),
    };
  }

  return validateRequestBody(request, schema);
}
