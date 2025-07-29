import {WhiteLabelConfig} from "@/types/WhiteLabel";
import {MailServer} from "@/types/Mail";
import {DatabaseConfig} from "@/types/Database";

export interface AdminUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    emailVerification: boolean;
}

export interface SelfSignup {
    enabled: boolean;
}

export interface Analytics {
    matomoUrl?: string | null;
    matomoSiteId?: string | null;
    matomoApiKey?: string | null;
    connectionTested?: boolean | null;
}

export interface License {
    accepted: boolean;
}

export interface SetupData {
    adminUser: AdminUser;
    database: DatabaseConfig;
    selfSignup: SelfSignup;
    branding: WhiteLabelConfig;
    mailServer: MailServer;
    analytics: Analytics;
    license: License;
    generatedAt?: string | Date
    version?: string;
}
