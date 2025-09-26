declare module 'conf' {
  interface Conf<T = Record<string, unknown>> {
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
    size: number;
    store: T;
  }

  interface Options<T = Record<string, unknown>> {
    defaults?: T;
    configName?: string;
    projectName?: string;
    projectSuffix?: string;
    cwd?: string;
    encryptionKey?: string | Buffer;
    fileExtension?: string;
    clearInvalidConfig?: boolean;
    serialize?: (value: T) => string;
    deserialize?: (text: string) => T;
  }

  class Conf<T = Record<string, unknown>> implements Conf<T> {
    constructor(options?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    has(key: string): boolean;
    delete(key: string): void;
    clear(): void;
    size: number;
    store: T;
  }

  export = Conf;
}
