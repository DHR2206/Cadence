import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence AI",
  description: "AI-powered deadline collision predictor and academic planner for DAU students."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
