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
    subtitle?: string;
    description?: string;
    contactMail?: string;
    contactPhone?: string;
    contactFax?: string;
}

export const normalizeWhiteLabelConfig = (config: Partial<WhiteLabelConfig>): WhiteLabelConfig => ({
    title: config.title ?? '',
    showTitle: config.showTitle ?? false,
    subtitle: config.subtitle ?? '',
    description: config.description ?? '',
    contactMail: config.contactMail ?? '',
    contactPhone: config.contactPhone ?? '',
    contactFax: config.contactFax ?? '',
});
