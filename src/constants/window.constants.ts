import type {WindowOptions} from '../types/relying-party-options';

export const DEFAULT_SIGNER_WINDOW_FEATURES =
  'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no';

export const DEFAULT_SIGNER_WINDOW_SIZE: Pick<WindowOptions, 'width' | 'height'> = {
  width: 576,
  height: 625
};

export const DEFAULT_SIGNER_WINDOW_TOP_RIGHT: WindowOptions = {
  ...DEFAULT_SIGNER_WINDOW_SIZE,
  position: 'top-right',
  features: DEFAULT_SIGNER_WINDOW_FEATURES
};

export const DEFAULT_SIGNER_WINDOW_CENTER: WindowOptions = {
  ...DEFAULT_SIGNER_WINDOW_SIZE,
  position: 'center',
  features: DEFAULT_SIGNER_WINDOW_FEATURES
};
