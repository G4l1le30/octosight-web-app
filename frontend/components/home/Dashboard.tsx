"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { EcosystemSectionSubsection } from "./sections/EcosystemSectionSubsection";
import { HeroSectionSubsection } from "./sections/HeroSectionSubsection";
import { SectionCtaBannerSubsection } from "./sections/SectionCtaBannerSubsection";
import { SectionSecuritySubsection } from "./sections/SectionSecuritySubsection";
import { SectionStatsRowSubsection } from "./sections/SectionStatsRowSubsection";

const dashboardSections = [
  { id: "hero", component: HeroSectionSubsection },
  { id: "stats", component: SectionStatsRowSubsection },
  { id: "security", component: SectionSecuritySubsection },
  { id: "ecosystem", component: EcosystemSectionSubsection },
  { id: "cta", component: SectionCtaBannerSubsection },
];

const ScrollSection = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center"],
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  if (prefersReduced) {
    return <section className="w-full">{children}</section>;
  }

  return (
    <motion.section
      ref={ref}
      style={{ opacity, y, willChange: "transform, opacity" }}
      className="w-full"
    >
      {children}
    </motion.section>
  );
};

export const Dashboard = () => {
  return (
    <main className="min-h-screen w-full bg-white">
      {dashboardSections.map(({ id, component: SectionComponent }) => (
        <ScrollSection key={id}>
          <SectionComponent />
        </ScrollSection>
      ))}
    </main>
  );
};
