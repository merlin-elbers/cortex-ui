export interface PublicKey {
    uid?: string;
    name: string;
    key?: string;
    isActive: boolean;
    expiresAt: Date | null;
    allowedIps?: string[] | null;
    createdAt: Date;
    createdBy?: string;
    description?: string;
    metadata?: object;
}