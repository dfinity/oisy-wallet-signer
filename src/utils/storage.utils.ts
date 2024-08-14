import {nonNullish} from '@dfinity/utils';

export const set = <T>({key, value}: {key: string; value: T}): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err: unknown) {
    // We use local storage to save the signer's permissions for convenience and to improve the UX.
    // If this fails, meaning permissions are not saved in storage, the user will always be prompted about the permissions.
    console.error(err);
  }
};

export const del = ({key}: {key: string}): void => {
  try {
    localStorage.removeItem(key);
  } catch (err: unknown) {
    // See comment in set.error
    console.error(err);
  }
};

export const get = <T>({key}: {key: string}): T | undefined => {
  try {
    const value = localStorage.getItem(key);
    return nonNullish(value) ? JSON.parse(value) : undefined;
  } catch (err: unknown) {
    // See comment in set.error
    console.error(err);
    return undefined;
  }
};
