import { AuthStateLogger } from "@/components/AuthStateLogger";
import { metadata } from "@/app/metadata";
import "./globals.css";

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthStateLogger />
        {children}
      </body>
    </html>
  );
}
