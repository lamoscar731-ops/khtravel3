import { Dispatch, SetStateAction, useEffect, useState } from "react";

export const jsonStorage = {
  read: <T,>(raw: string) => JSON.parse(raw) as T,
  write: (value: unknown) => JSON.stringify(value),
};

export const stringStorage = {
  read: (raw: string) => raw,
  write: (value: unknown) => String(value),
};

interface StorageCodec<T> {
  read: (raw: string) => T;
  write: (value: T) => string;
}

export function useLocalStorageState<T>(key: string, fallback: T, codec: StorageCodec<T> = jsonStorage): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : codec.read<T>(stored);
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(key, codec.write(value)); }
    catch (error) { console.warn(`Could not save ${key} to local storage.`, error); }
  }, [key, value, codec]);

  return [value, setValue];
}
