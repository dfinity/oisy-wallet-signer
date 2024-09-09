import {isNullish} from '@dfinity/utils';
import {RELYING_PARTY_SIGNER_WINDOW_FEATURES} from '../constants/relying-party.constants';
import type {WindowOptions} from '../types/relying-party-options';
import {isBrowser} from './env.utils';

export const windowFeatures = ({position, ...rest}: WindowOptions): string | undefined => {
  const fn = position === 'center' ? windowCenter : windowTopRight;
  return fn(rest);
};

const windowCenter = ({
  width,
  height,
  features = RELYING_PARTY_SIGNER_WINDOW_FEATURES
}: Omit<WindowOptions, 'position'>): string | undefined => {
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
  features = RELYING_PARTY_SIGNER_WINDOW_FEATURES
}: Omit<WindowOptions, 'position'>): string | undefined => {
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
