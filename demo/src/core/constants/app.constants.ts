export const DEV = import.meta.env.DEV;
export const PROD = import.meta.env.PROD;
export const WALLET_URL = PROD ? 'https://staging.oisy.com/sign' : 'http://localhost:5174/sign';

export const LOCAL_REPLICA_URL = 'http://localhost:4943';
export const MAINNET_REPLICA_URL = 'https://icp-api.io';

// How long the delegation identity should remain valid?
// e.g. BigInt(60 * 60 * 1000 * 1000 * 1000) = 1 hour in nanoseconds
export const AUTH_MAX_TIME_TO_LIVE = BigInt(60 * 60 * 1000 * 1000 * 1000);

export const AUTH_POPUP_WIDTH = 576;
export const AUTH_POPUP_HEIGHT = 625;

export const E8S_PER_ICP = 100_000_000n;

export const NANO_SECONDS_IN_MILLISECOND = 1_000_000n;
export const NANO_SECONDS_IN_MINUTE = NANO_SECONDS_IN_MILLISECOND * 1_000n * 60n;
