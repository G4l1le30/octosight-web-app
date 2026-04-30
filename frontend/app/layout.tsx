import "./globals.css";
import { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "OctoSight - Phishing Detection & Mitigation",
  description: "Advanced anti-phishing system for modern digital banking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased text-secondary bg-neutral-page`}>
        <AuthProvider>
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
