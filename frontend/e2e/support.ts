const apiPort = process.env.RHC_E2E_API_PORT ?? "8000";

export const API_BASE_URL = process.env.RHC_E2E_API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
