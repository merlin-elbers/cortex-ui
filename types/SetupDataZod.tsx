import { z } from "zod";

export const SetupDataZod = z.object({
    adminUser: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        password: z.string(),
        emailVerification: z.boolean(),
    }),
    database: z.object({
        uri: z.string(),
        dbName: z.string(),
        connectionTested: z.boolean(),
    }),
    selfSignup: z.object({
        enabled: z.boolean(),
    }),
    branding: z.object({
        logo: z
            .object({
                contentType: z.string().optional(),
                name: z.string().optional(),
                data: z.string().optional(),
                lastModified: z.union([z.string(), z.date(), z.number()]).nullable().optional(),
            })
            .optional(),
        title: z.string(),
        subtitle: z.string().optional(),
        description: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        contactFax: z.string().optional(),
    }),
    mailServer: z.object({
        type: z.enum(["smtp", "microsoft365"]),
        smtp: z
            .object({
                host: z.string().optional(),
                port: z.number().optional(),
                username: z.string().optional(),
                password: z.string().optional(),
                senderName: z.string().optional(),
                senderEmail: z.string().optional(),
                tested: z.boolean().optional(),
            })
            .optional(),
        microsoft365: z
            .object({
                tenantId: z.string().optional(),
                clientId: z.string().optional(),
                secretKey: z.string().optional(),
                authenticated: z.boolean().optional(),
                senderName: z.string().optional(),
                senderEmail: z.string().optional(),
            })
            .optional(),
    }),
    analytics: z.object({
        matomoUrl: z.string().optional(),
        matomoSiteId: z.string().optional(),
        matomoApiKey: z.string().optional(),
        connectionTested: z.boolean().optional(),
    }),
    license: z.object({
        accepted: z.boolean(),
    }),
});

export type SetupDataZod = z.infer<typeof SetupDataZod>;
