import { motion } from "framer-motion";
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

const ecoAnimations = `
@keyframes blob-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.12); opacity: 0.7; }
}
`;

const dotPositions = [
  "top-2 left-2", "top-2 right-2",
  "bottom-2 left-2", "bottom-2 right-2",
];

export const EcosystemSectionSubsection = () => {
  return (
    <section className="relative w-full bg-white px-0 py-18 md:py-24 overflow-hidden">
      <style>{ecoAnimations}</style>

      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,30,36,0.08) 0%, transparent 70%)', animation: 'blob-pulse 8s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[350px] w-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(227,30,36,0.06) 0%, transparent 70%)', animation: 'blob-pulse 8s ease-in-out infinite', animationDelay: '4s' }} />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-12 md:gap-16 px-6 md:px-8 py-0 relative z-10">

        <motion.header
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-col items-center gap-1.5 md:gap-2"
        >
          <p className="flex w-fit items-center justify-center text-center text-base md:text-lg font-bold uppercase leading-[20px] tracking-wide text-primary whitespace-nowrap">
            OUR CAPABILITIES
          </p>
          <h2 className="flex w-fit items-center justify-center text-center text-3xl md:text-4xl font-bold leading-9 md:leading-10 tracking-[0] text-secondary whitespace-nowrap">
            The OctoSight Ecosystem
          </h2>
          <div className="h-1 w-16 rounded-full bg-primary" aria-hidden="true" />
        </motion.header>

        <div className="grid h-fit w-full grid-cols-1 gap-6 md:gap-8 md:grid-cols-2 xl:grid-cols-4">
          {ecosystemCapabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
              <FlipCard
                className="h-[240px] md:h-[300px] w-full"
                direction="horizontal"
                trigger="hover"
                duration={0.5}
                perspective={1200}
              >
                <FlipCardFront className="relative flex flex-col items-center justify-center gap-4 md:gap-6 border-2 border-gray-200/80 bg-white p-6 md:p-8">
                  {dotPositions.map((pos, i) => (
                    <span key={i} className={`absolute ${pos} h-1.5 w-1.5 rounded-full bg-primary/30`} />
                  ))}
                  <span className="flex h-[72px] w-[72px] md:h-24 md:w-24 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-light hover:brightness-110 transition-all duration-200">
                    <Icon className="h-8 w-8 md:h-10 md:w-10 text-white" strokeWidth={1.5} />
                  </span>
                  <h3 className="text-center text-base md:text-lg font-bold leading-6 md:leading-7 tracking-[0] text-secondary">
                    {cap.title}
                  </h3>
                </FlipCardFront>

                <FlipCardBack className="flex flex-col items-start justify-center gap-3 md:gap-4 border-2 border-gray-200/80 bg-white p-6 md:p-8">
                  <span className="inline-flex h-8 w-8 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-light">
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </span>
                  <h3 className="text-base md:text-lg font-bold leading-6 md:leading-7 tracking-[0] text-secondary">
                    {cap.title}
                  </h3>
                  <p className="text-xs md:text-sm font-normal leading-[18px] md:leading-[22px] tracking-[0] text-secondary">
                    {cap.description}
                  </p>
                </FlipCardBack>
              </FlipCard>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

