import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const heroGridLines = `
@keyframes blob-pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.15); opacity: 0.8; }
}
`;

import { fadeSlideUp } from "@/lib/animations";

export const HeroSectionSubsection = () => {
  return (
    <motion.section {...fadeSlideUp} className="relative w-full min-h-screen flex flex-col justify-center bg-white px-6 py-12 md:px-8 md:pt-16 md:pb-24 overflow-hidden">
      <style>{heroGridLines}</style>

      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,30,36,0.12) 0%, transparent 70%)', animation: 'blob-pulse 8s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,30,36,0.08) 0%, transparent 70%)', animation: 'blob-pulse 8s ease-in-out infinite', animationDelay: '4s' }} />

      <div className="mx-auto grid h-fit w-full max-w-screen-xl grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2 lg:items-center">

        <article className="relative flex w-full flex-col items-start order-2 lg:order-1">
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="relative flex w-full flex-col items-start"
          >
            <h1 className="self-stretch text-4xl leading-[44px] md:text-5xl md:leading-[56px] lg:text-6xl lg:leading-[60px] font-normal">
              <span className="font-black text-secondary">
                Proactive Phishing Detection
                <br />
              </span>
              <span className="font-black bg-gradient-to-r from-primary via-primary-dark to-primary-light bg-clip-text text-transparent">
                Powered by Hybrid Risk Scoring
              </span>
            </h1>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mt-4 md:mt-6 flex w-full max-w-lg flex-col items-start"
          >
            <p className="text-base md:text-lg leading-[26px] md:leading-[29.2px] font-normal text-secondary">
              OctoSight combines human intelligence with machine learning to identify and mitigate phishing threats in real-time. Secure your digital banking experience.
            </p>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-label="Hero actions"
            className="relative flex w-full flex-wrap items-center gap-3 md:gap-4 pt-4 md:pt-6"
          >
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
          </motion.nav>
        </article>

        <motion.aside
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative order-1 flex w-full flex-col items-center lg:order-2 lg:items-start"
        >
          <div className="relative w-full max-w-[584px]">
            <Card className="flex w-full rotate-3 flex-col items-start rounded-3xl border-0 bg-gray-900 p-2 md:p-3 shadow-[0px_25px_50px_-12px_#00000060]">
              <CardContent className="relative w-full overflow-hidden rounded-2xl p-0">
                <Image
                  src="/hero-phishing.png"
                  alt="Waspada penipuan email phishing CIMB Niaga"
                  width={584}
                  height={480}
                  className="w-full h-auto object-cover object-center"
                  style={{ width: "100%", height: "auto" }}
                  priority
                />
              </CardContent>
            </Card>

            <Card className="absolute -bottom-3 md:-bottom-4 left-4 md:left-6 z-10 rounded-2xl border border-gray-100 bg-white shadow-[0px_10px_30px_-8px_#00000030]">
              <CardContent className="relative flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                  </span>
                </span>
                <div className="inline-flex flex-col items-start">
                  <p className="flex w-fit items-center whitespace-nowrap text-[9px] md:text-[10px] leading-[15px] font-bold tracking-wide text-secondary">
                    Welcome to
                  </p>
                  <p className="flex w-fit items-center whitespace-nowrap text-sm md:text-base leading-6 font-bold text-primary">
                    OCTOSIGHT
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.aside>

      </div>
    </motion.section>
  );
};

