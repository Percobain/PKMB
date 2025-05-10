/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_CLIENT_URL: string;
  readonly VITE_PINATA_JWT: string;
  readonly VITE_MY_PINATA_GATEWAY: string;
  readonly VITE_PKMB721: string;
  readonly VITE_PKMBToken: string;
  readonly VITE_Faucet: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
