import {isNullish} from '@dfinity/utils';
import {isBrowser} from './env.utils';

export interface WalletWindowOptions {
  position: 'top-right' | 'center';
  width: number;
  height: number;
  features?: string;
}

const WALLET_WINDOW_FEATURES =
  'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no';

export const WALLET_WINDOW_TOP_RIGHT: WalletWindowOptions = {
  position: 'top-right',
  width: 350,
  height: 600,
  features: WALLET_WINDOW_FEATURES
};

export const WALLET_WINDOW_CENTER: WalletWindowOptions = {
  position: 'center',
  width: 576,
  height: 625,
  features: WALLET_WINDOW_FEATURES
};

export const windowFeatures = ({position, ...rest}: WalletWindowOptions): string | undefined => {
  const fn = position === 'center' ? windowCenter : windowTopRight;
  return fn(rest);
};

const windowCenter = ({
  width,
  height,
  features = WALLET_WINDOW_FEATURES
}: Omit<WalletWindowOptions, 'position'>): string | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  if (isNullish(window) || isNullish(window.top)) {
    return undefined;
  }

  const {
    top: {innerWidth, innerHeight}
  } = window;

  const y = innerHeight / 2 + screenY - height / 2;
  const x = innerWidth / 2 + screenX - width / 2;

  return `${features}, width=${width}, height=${height}, top=${y}, left=${x}`;
};

const windowTopRight = ({
  width,
  height,
  features = WALLET_WINDOW_FEATURES
}: Omit<WalletWindowOptions, 'position'>): string | undefined => {
  if (!isBrowser()) {
    return undefined;
  }

  if (isNullish(window) || isNullish(window.top)) {
    return undefined;
  }

  const {
    top: {innerWidth, innerHeight}
  } = window;

  const y = outerHeight - innerHeight;
  const x = innerWidth - width;

  return `${features}, width=${width}, height=${height}, top=${y}, left=${x}`;
};
