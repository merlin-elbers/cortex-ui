import {Metadata} from "next";
import {Suspense} from "react";
import VerifyForm from "@/app/verify/VerifyForm";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "E-Mail verifizieren | CortexUI",
        description: "Verifiziere dein Konto an Hand von dem Verifizierungscode.",
        openGraph: {
            title: "E-Mail verifizieren | CortexUI",
            description: "Sichere E-Mail Verifizierung für dein Konto",
            url: `${process.env.NEXT_PUBLIC_APP_URI}/verify`,
            siteName: "CortexUI",
            images: [
                {
                    url: `${process.env.NEXT_PUBLIC_APP_URI}/og-login.png`,
                    width: 1200,
                    height: 630,
                    alt: "CortexUI E-Mail Verifizierung",
                }
            ],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: "E-Mail Verifizierung | CortexUI",
            description: "Verifiziere dein Konto an Hand von dem Verifizierungscode.",
            images: [`${process.env.NEXT_PUBLIC_APP_URI}/og-login.png`]
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_APP_URI}/verify`
        },
        robots: {
            index: false,
            follow: false,
            nocache: true
        }
    }
}

export default function Page() {
    return (
        <Suspense>
            <VerifyForm />
        </Suspense>
    )
}