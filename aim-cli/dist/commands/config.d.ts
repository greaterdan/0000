export declare class ConfigManager {
    private config;
    constructor();
    getConfig(key: string): Promise<string | null>;
    setConfig(key: string, value: string): Promise<void>;
    listConfig(): Promise<void>;
    getConfigValue(key: string): Promise<void>;
    setConfigValue(key: string, value: string): Promise<void>;
}
//# sourceMappingURL=config.d.ts.map