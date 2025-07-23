export interface SetupData {
    adminUser: {
        firstName: string
        lastName: string
        email: string
        password: string
        emailVerification: boolean
    };
    database: {
        uri: string
        dbName: string
        connectionTested: boolean
    };
    selfSignup: {
        enabled: boolean
    };
    branding: {
        logo?: {
            contentType?: string
            name?: string
            data?: string
            lastModified?: string | Date | number | null
        },
        title: string
    };
    mailServer: {
        type: 'smtp' | 'microsoft365'
        smtp?: {
            host?: string
            port?: number
            username?: string
            password?: string
            senderName?: string
            senderEmail?: string
            tested?: boolean
        };
        microsoft365?: {
            tenantId?: string
            clientId?: string
            secretKey?: string
            authenticated?: boolean
            senderName?: string
            senderEmail?: string
        };
    };
    analytics: {
        matomoUrl?: string
        matomoSiteId?: string
    };
    license: {
        accepted: boolean
    };
}