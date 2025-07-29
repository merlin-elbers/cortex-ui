export interface SMTPSettings {
    host?: string | null;
    port?: number | null;
    username?: string | null;
    password?: string | null;
    senderName?: string | null;
    senderEmail?: string | null;
    tested?: boolean | null;
}

export interface M365Settings {
    tenantId?: string | null;
    clientId?: string | null;
    secretKey?: string | null;
    authenticated?: boolean | null;
    senderName?: string | null;
    senderEmail?: string | null;
}

export type MailType = "smtp" | "microsoft365";

export interface MailServer {
    type: MailType;
    smtp?: SMTPSettings | null;
    microsoft365?: M365Settings | null;
}