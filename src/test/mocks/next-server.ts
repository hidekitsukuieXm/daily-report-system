/**
 * Next.js server モック
 * テスト環境で next/server をモックするためのファイル
 */

class MockHeaders {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();
    if (init) {
      if (init instanceof MockHeaders) {
        init.headers.forEach((value, key) => this.headers.set(key.toLowerCase(), value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) =>
          this.headers.set(key.toLowerCase(), value)
        );
      }
    }
  }

  get(key: string): string | null {
    return this.headers.get(key.toLowerCase()) ?? null;
  }

  set(key: string, value: string): void {
    this.headers.set(key.toLowerCase(), value);
  }

  has(key: string): boolean {
    return this.headers.has(key.toLowerCase());
  }

  delete(key: string): boolean {
    return this.headers.delete(key.toLowerCase());
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }

  keys(): IterableIterator<string> {
    return this.headers.keys();
  }

  values(): IterableIterator<string> {
    return this.headers.values();
  }
}

export class NextRequest {
  method: string;
  headers: MockHeaders;
  nextUrl: { pathname: string; searchParams: URLSearchParams };
  private body: string | null;
  url: string;

  constructor(
    url: string | URL,
    options?: {
      method?: string;
      headers?: HeadersInit;
      body?: BodyInit | null;
    }
  ) {
    const urlStr = url instanceof URL ? url.toString() : url;
    this.url = urlStr;
    this.method = options?.method ?? 'GET';
    this.headers = new MockHeaders(options?.headers);

    const urlObj = new URL(urlStr);
    this.nextUrl = {
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams,
    };

    this.body = typeof options?.body === 'string' ? options.body : null;
  }

  async json(): Promise<unknown> {
    if (!this.body) {
      throw new SyntaxError('Unexpected end of JSON input');
    }
    return JSON.parse(this.body);
  }

  async text(): Promise<string> {
    return this.body ?? '';
  }
}

export class NextResponse<T = unknown> {
  readonly status: number;
  readonly headers: MockHeaders;
  private readonly _body: T | null;

  constructor(body: BodyInit | null, options?: ResponseInit) {
    this._body = body as T | null;
    this.status = options?.status ?? 200;
    this.headers = new MockHeaders(options?.headers);
  }

  static json<TData>(
    data: TData,
    options?: { status?: number; headers?: HeadersInit }
  ): NextResponse<{ success: boolean; data?: TData; error?: unknown }> {
    const response = new NextResponse(JSON.stringify(data), {
      status: options?.status ?? 200,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ? Object.fromEntries(new Headers(options.headers).entries()) : {}),
      },
    });
    // Store the actual data for json() method
    (response as unknown as { _jsonData: TData })._jsonData = data;
    return response as NextResponse<{ success: boolean; data?: TData; error?: unknown }>;
  }

  async json(): Promise<T> {
    // Return the stored JSON data if available
    if ('_jsonData' in this) {
      return (this as unknown as { _jsonData: T })._jsonData;
    }
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body as T;
  }

  async text(): Promise<string> {
    if (typeof this._body === 'string') {
      return this._body;
    }
    return JSON.stringify(this._body);
  }
}
