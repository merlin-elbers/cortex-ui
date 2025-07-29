import {Metadata} from "next";
import LoginForm from "@/app/login/LoginForm";
import {Suspense} from "react";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Login | CortexUI",
        description: "Melde dich an, um auf dein CortexUI-Dashboard zuzugreifen.",
        openGraph: {
            title: "Login | CortexUI",
            description: "Sicherer Zugang zu deinem Admin-Dashboard.",
            url: `${process.env.NEXT_PUBLIC_APP_URI}/login`,
            siteName: "CortexUI",
            images: [
                {
                    url: `${process.env.NEXT_PUBLIC_APP_URI}/og-login.png`,
                    width: 1200,
                    height: 630,
                    alt: "CortexUI Login",
                }
            ],
            type: "website"
        },
        twitter: {
            card: "summary_large_image",
            title: "Login | CortexUI",
            description: "Melde dich bei deinem Dashboard an und behalte den Überblick.",
            images: [`${process.env.NEXT_PUBLIC_APP_URI}/og-login.png`]
        },
        alternates: {
            canonical: `${process.env.NEXT_PUBLIC_APP_URI}/login`
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
            <LoginForm />
        </Suspense>
    )
}