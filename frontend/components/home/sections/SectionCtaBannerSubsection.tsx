import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const ctaContent = {
  title: "Ready to live without phishing threats?",
  description:
    "Join OctoSight today and experience the future of anti-phishing protection for your enterprise.",
  buttonLabel: "Get Started Now",
};

export const SectionCtaBannerSubsection = () => {
  return (
    <section className="w-full bg-white px-4 py-16">
      <Card className="relative mx-auto flex w-full max-w-screen-xl overflow-hidden rounded-[40px] border-0 bg-[#e11d2e] shadow-[0px_25px_50px_-12px_#00000040]">
        <div className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-[#ffffff1a]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#ffffff1a]" />
        <CardContent className="relative flex w-full flex-col items-center gap-6 px-6 py-12 sm:px-10 sm:py-16 lg:px-20 lg:py-20">
          <header className="flex w-full justify-center">
            <h2 className="text-center text-3xl leading-tight text-white sm:text-4xl lg:text-5xl lg:leading-[48px] font-bold">
              {ctaContent.title}
            </h2>
          </header>
          <div className="flex w-full max-w-2xl justify-center pb-6">
            <p className="text-center text-lg leading-7 text-red-100 font-normal">
              {ctaContent.description}
            </p>
          </div>
          <Link href="/register">
            <Button
              type="button"
              className="h-auto rounded-full bg-white px-10 py-5 text-lg leading-7 text-[#e11d2e] shadow-[0px_8px_10px_-6px_#0000001a,0px_20px_25px_-5px_#0000001a] hover:bg-white/95 font-bold"
            >
              {ctaContent.buttonLabel}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </section>
  );
};

