/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD?: string;
  readonly VITE_BUDGET_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
