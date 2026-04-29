import Link from "next/link";
import React from "react";

const Hero: React.FC = () => {
  return (
    <section className="bg-white border-b border-neutral-border min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="container mx-auto px-4 text-center max-w-4xl py-20">
        <h1 className="text-4xl md:text-6xl font-black text-secondary leading-tight mb-6">
          Proactive Phishing Detection <br />
          <span className="text-primary">Powered by Hybrid Risk Scoring</span>
        </h1>
        <p className="text-lg text-secondary-light mb-10 max-w-2xl mx-auto font-medium">
          OctoSight combines human intelligence with machine learning to identify and mitigate phishing threats in real-time. Secure your digital banking experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/report" className="btn-primary text-lg px-10 py-4 shadow-xl shadow-primary/20">
            Report Incident
          </Link>
          <Link href="/edu" className="bg-white border-2 border-primary text-primary hover:bg-primary/5 font-bold px-10 py-4 rounded-lg transition-all duration-200">
            E-Learning
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
