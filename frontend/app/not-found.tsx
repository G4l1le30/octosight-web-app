import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 md:mb-8">
          <div className="text-8xl font-bold text-neutral-border/60 mb-4">404</div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-2">Page Not Found</h1>
          <p className="text-secondary/60 text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Check the URL or navigate back to a known page.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 md:px-6 py-3 bg-secondary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center justify-center px-4 md:px-6 py-3 border-2 border-neutral-border rounded-xl font-bold text-sm text-secondary hover:border-secondary/40 transition-all"
          >
            Report Phishing
          </Link>
        </div>
      </div>
    </div>
  );
}
