import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-white border-b border-neutral-border py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-black text-secondary leading-tight mb-6">
            Proactive Phishing Detection <br />
            <span className="text-primary">Powered by Hybrid Risk Scoring</span>
          </h1>
          <p className="text-lg text-secondary-light mb-10 max-w-2xl mx-auto">
            OctoSight combines human intelligence with machine learning to identify and mitigate phishing threats in real-time. Secure your digital banking experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/report" className="btn-primary text-lg px-8 py-3">
              Report Incident
            </Link>
            <Link href="/edu" className="bg-white border-2 border-primary text-primary hover:bg-primary/5 font-bold px-8 py-3 rounded-lg transition-all duration-200">
              E-Learning
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-neutral-page">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="card p-8">
            <p className="text-primary text-4xl font-black mb-2">1,200+</p>
            <p className="font-semibold opacity-60">Incidents Tracked</p>
          </div>
          <div className="card p-8">
            <p className="text-primary text-4xl font-black mb-2">85-90%</p>
            <p className="font-semibold opacity-60">Detection Rate</p>
          </div>
          <div className="card p-8">
            <p className="text-primary text-4xl font-black mb-2">&lt; 1 Hour</p>
            <p className="font-semibold opacity-60">Response SLA</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-16">The OctoSight Ecosystem</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="font-black text-xl">Rapid Reporting</h3>
              <p className="text-sm opacity-70">Easily submit suspicious URLs or messages via our streamlined portal.</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-black text-xl">Hybrid Detection</h3>
              <p className="text-sm opacity-70">AI-driven analysis combined with rule-based heuristics for maximum coverage.</p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-black text-xl">Real-time Triage</h3>
              <p className="text-sm opacity-70">Automated prioritization of high-risk cases to minimize potential damage.</p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-black text-xl">Targeted Edu</h3>
              <p className="text-sm opacity-70">Microlearning modules triggered by high-risk activities to improve digital literacy.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
