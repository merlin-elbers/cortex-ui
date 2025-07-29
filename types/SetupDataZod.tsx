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
                contentType: z.string().nullable().optional(),
                name: z.string().nullable().optional(),
                data: z.string().nullable().optional(),
                lastModified: z.union([z.string(), z.number()]).nullable().optional(),
            })
            .nullable()
            .optional(),
        title: z.string(),
        showTitle: z.boolean().default(false),
        subtitle: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        contactMail: z.string().nullable().optional(),
        contactPhone: z.string().nullable().optional(),
        contactFax: z.string().nullable().optional(),
    }),
    mailServer: z.object({
        type: z.enum(["smtp", "microsoft365"]),
        smtp: z
            .object({
                host: z.string().nullable().optional(),
                port: z.number().nullable().optional(),
                username: z.string().nullable().optional(),
                password: z.string().nullable().optional(),
                senderName: z.string().nullable().optional(),
                senderEmail: z.string().nullable().optional(),
                tested: z.boolean().nullable().optional(),
            })
            .nullable()
            .optional(),
        microsoft365: z
            .object({
                tenantId: z.string().nullable().optional(),
                clientId: z.string().nullable().optional(),
                secretKey: z.string().nullable().optional(),
                authenticated: z.boolean().nullable().optional(),
                senderName: z.string().nullable().optional(),
                senderEmail: z.string().nullable().optional(),
            })
            .nullable()
            .optional(),
    }),
    analytics: z.object({
        matomoUrl: z.string().nullable().optional(),
        matomoSiteId: z.string().nullable().optional(),
        matomoApiKey: z.string().nullable().optional(),
        connectionTested: z.boolean().nullable().optional(),
    }),
    license: z.object({
        accepted: z.boolean(),
    }),
    generatedAt: z.string().optional(),
    version: z.string().optional(),
});

export type SetupDataZod = z.infer<typeof SetupDataZod>;
