import { Button } from "@/components/ui/Button";

const navItems = [
  { label: "Home", active: true },
  { label: "Report Incident", active: false },
  { label: "Fraud Check", active: false },
  { label: "Check Status", active: false },
  { label: "E-Learning", active: false },
];

export const NavigationSubsection = () => {
  return (
    <header className="w-full border-b border-gray-100 bg-[#ffffffe6] px-8 py-0 backdrop-blur-[6px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)]">
      <nav
        aria-label="Primary"
        className="flex h-20 w-full items-center justify-between"
      >
        <div className="inline-flex flex-col items-start">
          <span className="mt-[-1.00px] flex w-fit items-center whitespace-nowrap text-2xl font-bold leading-8 tracking-[-1.20px] text-[#e11d2e]">
            OCTOSIGHT
          </span>
        </div>
        <ul className="inline-flex items-center">
          {navItems.map((item, index) => (
            <li
              key={item.label}
              className={
                index === 0
                  ? "inline-flex flex-col items-start"
                  : "inline-flex flex-col items-start pl-8 pr-0 py-0"
              }
            >
              <button
                type="button"
                className={`relative mt-[-1.00px] flex w-fit items-center whitespace-nowrap text-base tracking-[0] transition-colors ${
                  item.active
                    ? "font-semibold text-[#e11d2e] border-b-2 border-[#e11d2e] pb-0.5"
                    : "font-normal text-gray-600 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
        <div className="inline-flex items-center gap-0">
          <Button
            type="button"
            variant="outline"
            className="h-auto rounded-full border border-[#e11d2e] px-6 py-2 text-sm font-bold leading-5 tracking-[0] text-[#e11d2e] hover:bg-transparent hover:text-[#e11d2e]"
          >
            Login
          </Button>
          <div className="inline-flex flex-col items-start pl-4 pr-0 py-0">
            <Button
              type="button"
              className="h-auto rounded-full bg-[#e11d2e] px-6 py-2 text-sm font-bold leading-5 tracking-[0] text-white shadow-[0px_4px_6px_-4px_#fecaca,0px_10px_15px_-3px_#fecaca] hover:bg-[#e11d2e]"
            >
              Register
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};

