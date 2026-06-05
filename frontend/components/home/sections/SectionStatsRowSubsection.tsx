const stats = [
  { value: "1,200+", label: "INCIDENTS TRACKED" },
  { value: "85-90%", label: "DETECTION ACCURACY" },
  { value: "< 1 Hr", label: "RESPONSE SLA" },
  { value: "24/7", label: "ACTIVE MONITORING" },
];

const marqueeItems = [...stats, ...stats, ...stats, ...stats];

export const SectionStatsRowSubsection = () => {
  return (
    <section className="w-full bg-white border-t border-gray-100 py-8 md:py-12 overflow-hidden">
      <div className="mx-auto flex w-full max-w-6xl">
      <style>{`
        @keyframes marquee-slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%       { opacity: 1;    transform: scale(1); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          will-change: transform;
          animation: marquee-slide 20s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .blink-dot {
          animation: dot-blink 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="marquee-track">
        {marqueeItems.map((stat, index) => (
          <div key={index} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-0.5 md:gap-1 text-center px-10 md:px-14">
              <p className="whitespace-nowrap text-3xl md:text-4xl leading-10 tracking-[0] text-gray-900 font-bold">
                {stat.value}
              </p>
              <p className="whitespace-nowrap text-[9px] md:text-[10px] leading-[15px] tracking-[1.20px] text-gray-400 font-bold">
                {stat.label}
              </p>
            </div>
            <span
              className="blink-dot shrink-0 h-1.5 w-1.5 rounded-full bg-primary"
              style={{ animationDelay: `${(index % 4) * 0.35}s` }}
            />
          </div>
        ))}
      </div>
    </div></section>
  );
};

