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
      <div className="absolute -top-24 -right-24 w-72 md:w-96 h-72 md:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute -bottom-24 -left-24 w-72 md:w-96 h-72 md:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="container mx-auto px-3 md:px-4 text-center max-w-6xl py-14 md:py-20 relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary/5 border border-primary/10 rounded-full mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-primary rounded-full animate-ping"></div>
          <span className="text-xs md:text-sm font-bold uppercase tracking-wide text-primary">
            Welcome to OctoSight Intelligence
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-secondary leading-[1.1] mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          Proactive Phishing Detection <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-primary-light">
            Powered by Hybrid Risk Scoring
          </span>
        </h1>

        <p className="text-lg md:text-xl text-secondary mb-12 md:mb-16 max-w-3xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          OctoSight combines human intelligence with machine learning to
          identify and mitigate phishing threats in real-time. Secure your
          digital banking experience.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 md:gap-5 justify-center mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <Link
            href="/report"
            className="btn-primary text-base md:text-lg px-10 md:px-12 py-3 md:py-4 shadow-2xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
          >
            Report Incident
          </Link>
          <Link
            href="/edu"
            className="bg-white border-2 border-secondary/10 text-secondary hover:border-primary hover:text-primary font-bold px-10 md:px-12 py-3 md:py-4 rounded-lg md:rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 md:gap-2 group"
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
