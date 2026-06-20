import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cadence-seven-eta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cadence",
    template: "%s | Cadence"
  },
  description: "AI-powered academic planner",
  applicationName: "Cadence",
  icons: {
    icon: [{ url: "/logo.jpg", type: "image/jpeg" }],
    shortcut: ["/logo.jpg"],
    apple: [{ url: "/logo.jpg", type: "image/jpeg" }]
  },
  openGraph: {
    title: "Cadence",
    description: "AI-powered academic planner",
    url: siteUrl,
    siteName: "Cadence",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Cadence AI academic planner"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadence",
    description: "AI-powered academic planner",
    images: ["/logo.jpg"]
  }
};
