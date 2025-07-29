export interface ServerStatus {
    databaseOnline: boolean;
    selfSignupEnabled: boolean;
    smtpServerConfigured: boolean;
    m365Configured: boolean;
    matomoConfigured: boolean;
}

export interface DatabaseHealth {
    dbName: string;
    serverVersion: string;
    uptimeSeconds: number;
    connectionCount: number;
    indexes: number | string;
    storageSizeMB: number;
    latencyMs: number;
}
