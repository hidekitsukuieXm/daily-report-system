/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_JWT_SECRET: string;
  readonly VITE_JWT_EXPIRES_IN: string;
  readonly VITE_REFRESH_TOKEN_EXPIRES_IN: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};
