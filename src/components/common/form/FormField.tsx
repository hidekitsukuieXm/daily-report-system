/**
 * フォームフィールドコンポーネント
 */

import type { ReactNode } from 'react';

import './FormField.css';

export type FormFieldProps = {
  /** ラベル */
  label: string;
  /** フィールドID（ラベルとの紐付け用） */
  htmlFor?: string;
  /** 必須フラグ */
  required?: boolean;
  /** ヘルプテキスト */
  helpText?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 横並びレイアウト */
  horizontal?: boolean;
  /** 子要素（フォームコントロール） */
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required = false,
  helpText,
  errorMessage,
  horizontal = false,
  children,
}: FormFieldProps) {
  const helpId = helpText && htmlFor ? `${htmlFor}-help` : undefined;
  const errorId = errorMessage && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div
      className={`form-field ${horizontal ? 'form-field--horizontal' : ''} ${errorMessage ? 'form-field--error' : ''}`}
    >
      <label
        htmlFor={htmlFor}
        className="form-field-label"
      >
        {label}
        {required && (
          <span className="form-field-required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="form-field-control">
        {children}

        {helpText && !errorMessage && (
          <p id={helpId} className="form-field-help">
            {helpText}
          </p>
        )}

        {errorMessage && (
          <p id={errorId} className="form-field-error" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
