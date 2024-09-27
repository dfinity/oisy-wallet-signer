export const DEV = import.meta.env.DEV;
export const PROD = import.meta.env.PROD;
export const WALLET_URL = PROD ? 'https://staging.oisy.com/sign' : 'http://localhost:5174/sign';
export const LOCAL_REPLICA_URL = 'http://localhost:4943';
