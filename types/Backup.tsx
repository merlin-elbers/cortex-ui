export interface BackupFile {
    fileName: string;
    createdAt: Date | string;
}

export interface BackupSettingsSchema {
    frequency: string;
    cleanUpDays: number;
}