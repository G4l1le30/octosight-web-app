import React from "react";

const Stats: React.FC = () => {
  const statsData = [
    { value: "1,200+", label: "Incidents Tracked" },
    { value: "85-90%", label: "Detection Rate" },
    { value: "< 1 Hour", label: "Response SLA" },
  ];

  return (
    <section className="pt-20 md:pt-24 pb-24 md:pb-32 bg-neutral-page/30">
      <div className="container mx-auto px-3 md:px-4 max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 md:mb-20 text-secondary">
          Platform Impact & Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="card p-6 md:p-8 border border-neutral-border bg-white transition-all hover:border-primary/30 hover:shadow-md group"
            >
              <p className="text-primary text-3xl md:text-4xl font-bold mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                {stat.value}
              </p>
              <p className="text-base md:text-lg font-bold text-secondary/80 tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
