import type {Metadata} from "next";
import "./globals.css";
import React from "react";
import {AuthProvider} from "@/context/AuthContext";
import AdminSidebar from "@/components/AdminSidebar";
import Notifications from "@/lib/notifications";

export const metadata: Metadata = {
    title: {
        default: "CortexUI – Modulares Admin Dashboard",
        template: "%s | CortexUI",
    },
    description:
        "CortexUI ist ein hochmodernes Admin Dashboard mit CMS, Analytics, User Management und M365/SMTP Integration – voll modular und Open Source.",
    applicationName: "CortexUI",
    keywords: [
        "Admin Dashboard",
        "Headless CMS",
        "Open Source",
        "NextJS",
        "FastAPI",
        "CortexUI",
        "Analytics",
        "User Management",
        "MongoDB",
        "M365 Integration",
    ],
    authors: [{ name: "elbers.dev", url: "https://www.elbers.dev" }],
    creator: "elbers.dev",
    manifest: "/site.webmanifest",
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-32x32.png",
        apple: "/apple-icon.png",
    },
    appleWebApp: {
        title: "CortexUI",
        statusBarStyle: "black-translucent",
        capable: true,
    },
    openGraph: {
        title: "CortexUI",
        description:
            "Das Open Source Admin Dashboard für Developer. Modular, mächtig, modern.",
        url: "https://github.com/merlin-elbers/cortex-ui",
        siteName: "CortexUI",
        images: [
            {
                url: "/og-cover.png",
                width: 1200,
                height: 630,
                alt: "CortexUI – Admin Dashboard",
            },
        ],
        locale: "de_DE",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "CortexUI",
        description:
            "Modulares Admin Backend mit CMS, Analytics & User Management. Open Source & Developer-first.",
        site: "@cortexui",
        creator: "@cortexui",
        images: ["/og-cover.png"],
    },
    metadataBase: new URL("https://github.com/merlin-elbers/cortex-ui"),
    other: {
        "apple-mobile-web-app-title": "CortexUI"
    }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="de">
            <body className={`antialiased bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50`}>
                <Notifications />
                <AuthProvider>
                    <div className={"min-h-screen flex"}>
                        <AdminSidebar />
                        <main className={"flex-1 overflow-auto"}>
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
