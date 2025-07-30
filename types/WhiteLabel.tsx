interface WhiteLabelLogo {
    contentType?: string;
    name?: string;
    data?: string;
    lastModified?: string | number;
}

export interface WhiteLabelConfig {
    logo?: WhiteLabelLogo;
    title: string;
    showTitle: boolean;
    externalUrl: string;
    subtitle?: string;
    description?: string;
    contactMail?: string;
    contactPhone?: string;
    contactFax?: string;
}
