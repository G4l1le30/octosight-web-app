import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 sm:px-8 py-8 md:py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 md:mb-8">
          <div className="text-7xl md:text-8xl font-bold text-primary/20 mb-3 md:mb-4">404</div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-1.5 md:mb-2">Page Not Found</h1>
          <p className="text-secondary/80 text-xs md:text-sm leading-relaxed font-medium">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Check the URL or navigate back to a known page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 bg-primary text-white rounded-lg md:rounded-xl font-bold text-xs md:text-sm hover:opacity-90 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center justify-center px-4 md:px-6 py-2 md:py-3 border-2 border-primary/30 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-primary hover:bg-primary/5 transition-all"
          >
            Report Phishing
          </Link>
        </div>
      </div>
    </div>
  );
}
