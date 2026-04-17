import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "OctoSight - Phishing Detection & Mitigation",
  description: "Advanced anti-phishing system for modern digital banking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-secondary bg-neutral-page">
        <header className="sticky top-0 z-50 bg-white border-b border-neutral-border shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-primary text-2xl font-black tracking-tight">OCTOSIGHT</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-primary">Home</Link>
              <Link href="/report" className="text-sm font-medium hover:text-primary">Report Incident</Link>
              <Link href="/status" className="text-sm font-medium hover:text-primary">Check Status</Link>
              <Link href="/edu" className="text-sm font-medium hover:text-primary">E-Learning</Link>
              <div className="w-px h-4 bg-neutral-border mx-2"></div>
              <Link href="/admin" className="text-sm font-semibold text-secondary-light hover:text-secondary px-3 py-1.5 border border-neutral-border rounded-md">Admin Portal</Link>
            </nav>
            
            <button className="md:hidden text-secondary p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem-4rem)]">
          {children}
        </main>

        <footer className="bg-secondary text-white py-8 border-t border-neutral-border">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm opacity-80">© 2026 OctoSight. Developed by Team CyberSentinel (Universitas Brawijaya) for CIMB Niaga Simulator.</p>
            <div className="flex justify-center gap-4 mt-4 text-xs opacity-60">
              <Link href="#">Terms of Use</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Contact Center</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
