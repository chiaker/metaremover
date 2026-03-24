interface ImportMetaEnv {
  readonly VITE_PLISIO_CREATE_INVOICE_URL?: string;
  readonly VITE_PLISIO_PLAN_NAME?: string;
  readonly VITE_PLISIO_PRICE_USD?: string;
  readonly VITE_PLISIO_SUCCESS_URL?: string;
  readonly VITE_PLISIO_FAIL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
