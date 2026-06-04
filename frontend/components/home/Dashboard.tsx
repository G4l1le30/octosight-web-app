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

export const Dashboard = () => {
  return (
    <main className="min-h-screen w-full bg-white">
      {dashboardSections.map(({ id, component: SectionComponent }) => (
        <section key={id} aria-label={id} className="w-full">
          <SectionComponent />
        </section>
      ))}
    </main>
  );
};
