import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/Button";
import { fadeSlideUp } from "@/lib/animations";

const footerSections = [
  {
    title: "Navigation",
    items: ["Home", "Report Incident", "Fraud Check", "E-Learningh"],
  },
  {
    title: "Resources",
    items: ["Security Blog", "API Docs", "Whitepapers", "Help Center"],
  },
  {
    title: "Support",
    items: ["Contact Us", "Privacy Policy", "Terms of Service"],
  },
];

export const FooterSubsection = () => {
  return (
    <motion.footer {...fadeSlideUp} className="w-full bg-[#e11d2e] pt-20 pb-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-8">
        <Card className="border-0 bg-transparent shadow-none">
          <CardContent className="grid h-fit grid-cols-1 gap-12 border-b border-[#ffffff33] px-0 pt-0 pb-16 md:grid-cols-10">
            <section className="col-span-1 flex h-fit w-full flex-col items-start gap-[23.3px] md:col-span-4">
              <h2 className="w-fit whitespace-nowrap text-3xl font-bold leading-9 tracking-[-1.50px] text-white">
                OCTOSIGHT
              </h2>
              <div className="flex max-w-xs w-80 flex-col items-start">
                <p className=" text-sm font-normal leading-[22.8px] tracking-[0] text-white">
                  Powered by Team CyberSentinel. OctoSight
                  <br />
                  protects the future of digital banking through
                  <br />
                  innovative phishing mitigation solutions.
                </p>
              </div>
            </section>
            {footerSections.map((section, index) => (
              <nav
                key={section.title}
                aria-label={section.title}
                className={`col-span-1 flex h-fit w-full flex-col items-start gap-6 pt-0 px-0 ${index === 2
                    ? "pb-[52.25px] md:col-span-2"
                    : "pb-[16.25px] md:col-span-2"
                  }`}
              >
                <h3 className="self-stretch text-base font-bold leading-6 tracking-[0] text-white">
                  {section.title}
                </h3>
                <ul className="flex w-full flex-col items-start gap-4">
                  {section.items.map((item) => (
                    <li key={item} className="w-full">
                      <Button
                        variant="ghost"
                        className="h-auto justify-start p-0 text-left text-sm font-normal leading-5 tracking-[0] text-white hover:bg-transparent hover:text-white"
                      >
                        {item}
                      </Button>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </CardContent>
        </Card>
        <div className="flex w-full flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="w-fit whitespace-nowrap text-[10px] font-bold leading-[15px] tracking-[1.00px] text-red-200">
            © 2024 OCTOSIGHT ALL RIGHTS RESERVED.
          </p>
          <p className="w-fit whitespace-nowrap text-[10px] font-bold leading-[15px] tracking-[1.00px] text-red-200">
            PHISHING AND FRAUD DETECTION
          </p>
        </div>
      </div>
    </motion.footer>
  );
};

