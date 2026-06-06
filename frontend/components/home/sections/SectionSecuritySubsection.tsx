"use client";

import { motion } from "framer-motion";
import { fadeSlideUp } from "@/lib/animations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2, FileSearch, Signal } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const evidenceBadges = ["ENCRYPTED", "COMPLIANT"];

export const SectionSecuritySubsection = () => {
  const { user } = useAuth();

  return (
    <motion.section {...fadeSlideUp} className="relative w-full bg-gray-50 px-6 md:px-8 py-20 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 md:gap-16 relative z-10">
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-col items-center gap-1.5 md:gap-2"
        >
          <p className="flex w-fit items-center justify-center text-center text-base md:text-lg font-bold leading-[20px] tracking-wide text-primary">
            ADVANCED PROTECTION
          </p>
          <h2 className="flex w-fit items-center justify-center text-center text-3xl md:text-4xl lg:text-5xl font-bold leading-tight md:leading-tight tracking-[0] text-secondary">
            Comprehensive Security Features
          </h2>
          <div className="h-1 w-16 md:w-24 mt-1 rounded-full bg-primary" />
        </motion.header>

        <div className="w-full flex flex-col gap-4 md:gap-5">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex w-full flex-col items-stretch gap-4 md:gap-5 lg:flex-row"
          >
            <Card
              className="group relative w-full h-[350px] md:h-[465px] overflow-hidden rounded-3xl border-0 shadow-none lg:flex-[2] cursor-pointer"
              style={{
                backgroundImage: "url('/bg-ai-analysis.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <CardContent className="relative flex h-full flex-col justify-end p-0">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,15,28,0.95)_0%,rgba(10,15,28,0.4)_50%,rgba(10,15,28,0.1)_100%)]" />
                <div className="relative flex w-full flex-col items-start gap-2.5 md:gap-3 p-6 md:p-8">
                  <h3 className="flex w-fit items-center text-xl md:text-2xl font-bold leading-7 md:leading-8 tracking-[0] text-white">
                    AI-Powered Analysis
                  </h3>
                  <p className="w-fit max-w-md text-sm md:text-base font-normal leading-5 md:leading-6 tracking-[0] text-white">
                    Utilizing advanced machine learning models to identify complex
                    phishing patterns in real-time.
                  </p>
                  <div className="grid w-full grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:pt-3">
                    <div className="overflow-hidden">
                      <Link href="/report" className="block w-full">
                        <Button className="h-auto w-full rounded-xl bg-white px-0 py-2.5 md:py-3 text-sm md:text-base font-bold leading-6 tracking-[0] text-primary hover:bg-white/90">
                          Report Incident
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex w-full flex-col gap-4 md:gap-5 lg:flex-[1]">

              <Card className="flex-1 rounded-3xl border border-solid border-gray-100 bg-white shadow-none h-[128px] md:h-[170px]">
                <CardContent className="flex h-full flex-col items-start gap-2.5 md:gap-3 p-6 md:p-8">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                    <Signal className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="text-lg md:text-xl font-bold leading-6 md:leading-7 tracking-[0] text-secondary">
                    Official Reporting
                  </h3>
                  <p className="text-sm md:text-base font-normal leading-5 md:leading-6 tracking-[0] text-secondary">
                    Seamlessly submit threats directly to banking authorities.
                  </p>
                </CardContent>
              </Card>

              <Card className="flex-1 rounded-3xl border border-solid border-gray-100 bg-white shadow-none h-[128px] md:h-[170px]">
                <CardContent className="flex h-full flex-col items-start gap-2.5 md:gap-3 p-6 md:p-8">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                    <BarChart2 className="h-4 w-4 text-primary" />
                  </span>
                  <h3 className="text-lg md:text-xl font-bold leading-6 md:leading-7 tracking-[0] text-secondary">
                    Admin Triage Tools
                  </h3>
                  <p className="text-sm md:text-base font-normal leading-5 md:leading-6 tracking-[0] text-secondary">
                    Investigation dashboard for in-depth security analysis.
                  </p>
                </CardContent>
              </Card>

            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex w-full flex-col gap-4 md:gap-5 lg:flex-row"
          >
            <Card
              className="group relative h-[225px] md:h-[300px] w-full overflow-hidden rounded-3xl border-0 shadow-none lg:flex-1 cursor-pointer"
              style={{
                backgroundImage: "url('/bg-realtime-notifications.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <CardContent className="relative flex h-full flex-col justify-end p-0">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.05)_100%)]" />
                <div className="relative flex w-full flex-col items-start gap-1.5 md:gap-2 p-6 md:p-8">
                  <h3 className="flex w-fit items-center whitespace-nowrap text-lg md:text-xl font-bold leading-6 md:leading-7 tracking-[0] text-white">
                    Real-time Notifications
                  </h3>
                  <p className="w-fit text-xs md:text-sm font-normal leading-4 md:leading-5 tracking-[0] text-white">
                    Instant alerts for new threats detected in your ecosystem.
                  </p>
                  <div className="grid w-full grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:pt-3">
                    <div className="overflow-hidden">
                      <Link href={user ? "/status" : "/login"} className="block w-full">
                        <Button className="h-auto w-full rounded-xl bg-white px-0 py-2.5 md:py-3 text-sm md:text-base font-bold leading-6 tracking-[0] text-primary hover:bg-white/90">
                          Check Status
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="group relative h-[225px] md:h-[300px] w-full overflow-hidden rounded-3xl border-0 shadow-none lg:flex-1 cursor-pointer"
              style={{
                backgroundImage: "url('/bg-microlearning.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <CardContent className="relative flex h-full w-full flex-col justify-end p-0">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_50%,rgba(225,29,46,0.15)_100%)]" />
                <div className="relative flex w-full flex-col items-start gap-2.5 md:gap-3 p-6 md:p-8">
                  <h3 className="flex w-fit items-center whitespace-nowrap text-xl md:text-2xl font-bold leading-7 md:leading-8 tracking-[0] text-white">
                    Microlearning Modules
                  </h3>
                  <p className="w-fit text-xs md:text-sm font-normal leading-4 md:leading-5 tracking-[0] text-white">
                    Educational content designed to boost long-term vigilance and
                    security awareness.
                  </p>
                  <div className="grid w-full grid-rows-[0fr] transition-all duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:pt-3">
                    <div className="overflow-hidden">
                      <Link href="/edu" className="block w-full">
                        <Button className="h-auto w-full rounded-xl bg-white px-0 py-2.5 md:py-3 text-sm md:text-base font-bold leading-6 tracking-[0] text-primary hover:bg-white/90">
                          Start Learning
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-[225px] md:h-[300px] w-full rounded-3xl border border-solid border-gray-100 bg-white shadow-none lg:flex-1">
              <CardContent className="flex h-full w-full flex-col items-start justify-start gap-2.5 md:gap-3 p-6 md:p-8">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                  <FileSearch className="h-4 w-4 text-primary" />
                </span>
                <h3 className="text-lg md:text-xl font-bold leading-6 md:leading-7 tracking-[0] text-secondary">
                  Evidence Management
                </h3>
                <p className="text-xs md:text-sm font-normal leading-[18px] md:leading-[22px] tracking-[0] text-secondary">
                  Securely upload and store screenshots or transaction logs for
                  triage. Our encrypted vault ensures chain of custody for legal
                  and banking requirements.
                </p>
                <div className="inline-flex items-center gap-2 mt-auto">
                  {evidenceBadges.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="rounded-md bg-gray-100 px-3 py-1 text-[9px] md:text-[10px] font-bold leading-[15px] tracking-[0] text-secondary hover:bg-gray-100"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

          </motion.div>
        </div>

      </div>
    </motion.section>
  );
};

