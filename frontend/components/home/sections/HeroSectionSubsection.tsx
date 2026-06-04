import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  { label: "Report Incident", variant: "primary", href: "/report" },
  { label: "E-Learning", variant: "secondary", href: "/edu" },
] as const;

export const HeroSectionSubsection = () => {
  return (
    <section className="relative w-full bg-white px-8 pt-16 pb-24">
      <div className="mx-auto grid h-fit w-full max-w-screen-xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">

        <article className="relative flex w-full flex-col items-start order-2 lg:order-1">
          <header className="relative flex w-full flex-col items-start">
            <h1 className="self-stretch text-5xl leading-[56px] font-normal tracking-[0] lg:text-6xl lg:leading-[60px]">
              <span className="font-bold text-gray-900">
                Proactive Phishing Detection
                <br />
              </span>
              <span className="font-bold bg-gradient-to-r from-[#e11d2e] via-[#c41525] to-[#ff5566] bg-clip-text text-transparent">
                Powered by Hybrid Risk Scoring
              </span>
            </h1>
          </header>

          <div className="relative mt-6 flex w-full max-w-lg flex-col items-start">
            <p className=" text-lg leading-[29.2px] font-normal tracking-[0] text-gray-500">
              OctoSight combines human intelligence with machine learning to identify and mitigate phishing threats in real-time. Secure your digital banking experience.
            </p>
          </div>

          <nav
            aria-label="Hero actions"
            className="relative flex w-full flex-wrap items-center gap-4 pt-6"
          >
            {actions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="ghost"
                  className={
                    action.variant === "primary"
                      ? "relative h-auto rounded-full bg-[#e11d2e] px-8 py-[17px] text-white hover:bg-[#e11d2e]/90 gap-2"
                      : "h-auto rounded-full border border-solid border-gray-200 bg-white px-8 py-4 text-gray-700 hover:bg-gray-50"
                  }
                >
                  {action.variant === "primary" && (
                    <span className="absolute inset-0 rounded-full bg-[#ffffff01] shadow-[0px_8px_10px_-6px_#fecaca,0px_20px_25px_-5px_#fecaca]" />
                  )}
                  <span className="relative flex w-fit items-center justify-center whitespace-nowrap text-center text-base leading-6 font-bold tracking-[0]">
                    {action.label}
                  </span>
                  {action.variant === "primary" && (
                    <ArrowRight className="relative h-4 w-4" />
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </article>

        <aside className="relative order-1 flex w-full flex-col items-center lg:order-2 lg:items-start">
          <div className="relative w-full max-w-[584px]">
            <Card className="flex w-full rotate-3 flex-col items-start rounded-3xl border-0 bg-gray-900 p-3 shadow-[0px_25px_50px_-12px_#00000060]">
              <CardContent className="relative w-full overflow-hidden rounded-2xl p-0">
                <img
                  src="/hero-phishing.png"
                  alt="Waspada penipuan email phishing CIMB Niaga"
                  className="h-[400px] w-full object-cover object-center lg:h-[480px]"
                />
              </CardContent>
            </Card>

            <Card className="absolute -bottom-4 left-6 z-10 rounded-2xl border border-gray-100 bg-white shadow-[0px_10px_30px_-8px_#00000030]">
              <CardContent className="relative flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e11d2e] opacity-60" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e11d2e]" />
                  </span>
                </span>
                <div className="inline-flex flex-col items-start">
                  <p className="flex w-fit items-center whitespace-nowrap text-[10px] leading-[15px] font-bold tracking-[1.00px] text-gray-400">
                    Welcome to
                  </p>
                  <p className="flex w-fit items-center whitespace-nowrap text-base leading-6 font-bold tracking-[0] text-gray-900">
                    OctoSight
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

      </div>
    </section>
  );
};

