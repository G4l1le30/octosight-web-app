import { Zap, ShieldCheck, BarChart2, BookOpen, LucideIcon } from "lucide-react";
import { FlipCard, FlipCardFront, FlipCardBack } from "@/components/ui/flip-card";

interface Capability {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ecosystemCapabilities: Capability[] = [
  {
    title: "Rapid Reporting",
    description:
      "Instant reporting mechanism for suspicious emails and URLs integrated directly into your workflow.",
    icon: Zap,
  },
  {
    title: "Hybrid Detection",
    description:
      "Combining AI-driven analysis with expert human verification to ensure zero false positives.",
    icon: ShieldCheck,
  },
  {
    title: "Real-time Triage",
    description:
      "Automated classification of threats based on severity levels for immediate response actions.",
    icon: BarChart2,
  },
  {
    title: "Targeted Education",
    description:
      "Personalized security training modules based on the specific threats your organization faces.",
    icon: BookOpen,
  },
];

export const EcosystemSectionSubsection = () => {
  return (
    <section className="w-full bg-white px-0 py-24">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-start gap-16 px-8 py-0">

        <header className="flex w-full flex-col items-center gap-2">
          <p className="flex w-fit items-center justify-center text-center text-[10px] font-bold uppercase leading-[15px] tracking-[2px] text-[#e11d2e] whitespace-nowrap">
            OUR CAPABILITIES
          </p>
          <h2 className="flex w-fit items-center justify-center text-center text-3xl font-bold leading-9 tracking-[0] text-gray-900 whitespace-nowrap">
            The OctoSight Ecosystem
          </h2>
          <div className="h-1 w-16 rounded-full bg-[#e11d2e]" aria-hidden="true" />
        </header>

        <div className="grid h-fit w-full grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {ecosystemCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <FlipCard
                key={cap.title}
                className="h-[240px] w-full"
                direction="horizontal"
                trigger="hover"
                duration={0.5}
                perspective={1200}
              >
                <FlipCardFront className="flex flex-col items-center justify-center gap-6 border border-gray-100 bg-white p-8">
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e11d2e] shadow-[0_0_0_8px_rgba(225,29,46,0.08)]">
                    <Icon className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </span>
                  <h3 className="text-center text-lg font-bold leading-7 tracking-[0] text-gray-900">
                    {cap.title}
                  </h3>
                </FlipCardFront>

                <FlipCardBack className="flex flex-col items-start justify-center gap-4 border border-[#e11d2e]/20 bg-white p-8">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#e11d2e]">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <h3 className="text-lg font-bold leading-7 tracking-[0] text-gray-900">
                    {cap.title}
                  </h3>
                  <p className="text-sm font-normal leading-[22px] tracking-[0] text-gray-500">
                    {cap.description}
                  </p>
                </FlipCardBack>
              </FlipCard>
            );
          })}
        </div>

      </div>
    </section>
  );
};

