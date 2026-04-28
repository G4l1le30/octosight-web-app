import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";

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
      <body className="font-sans antialiased text-secondary bg-neutral-page">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem-4rem)]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
