import Link from "next/link";
import React from "react";

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-page/30 to-white min-h-[calc(100vh-64px)] flex items-center justify-center">
      {/* Background Decorations */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, #333 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="container mx-auto px-4 text-center max-w-5xl py-20 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wide text-primary">
            Welcome to OctoSight Intelligence
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-secondary leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Proactive Phishing Detection <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-primary-light">
            Powered by Hybrid Risk Scoring
          </span>
        </h1>

        <p className="text-lg text-secondary/70 mb-12 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          OctoSight combines human intelligence with machine learning to
          identify and mitigate phishing threats in real-time. Secure your
          digital banking experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <Link
            href="/report"
            className="btn-primary text-lg px-12 py-4 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            Report Incident
          </Link>
          <Link
            href="/edu"
            className="bg-white border-2 border-secondary/10 text-secondary hover:border-primary hover:text-primary font-bold px-12 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            E-Learning
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
