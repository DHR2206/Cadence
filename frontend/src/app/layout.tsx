import { AuthStateLogger } from "@/components/AuthStateLogger";
import { SiteFooter } from "@/components/SiteFooter";
import { metadata } from "@/app/metadata";
import "./globals.css";

export { metadata };

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className="pb-20">
        <AuthStateLogger />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
