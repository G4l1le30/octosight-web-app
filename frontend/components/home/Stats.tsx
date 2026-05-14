import React from "react";

const Stats: React.FC = () => {
  const statsData = [
    { value: "1,200+", label: "Incidents Tracked" },
    { value: "85-90%", label: "Detection Rate" },
    { value: "< 1 Hour", label: "Response SLA" },
  ];

  return (
    <section className="pt-24 pb-32 bg-neutral-page/30">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-20 text-secondary">
          Platform Impact & Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="card p-8 border border-neutral-border bg-white transition-all hover:border-primary/30 hover:shadow-md group"
            >
              <p className="text-primary text-4xl font-black mb-4 group-hover:scale-110 transition-transform">
                {stat.value}
              </p>
              <p className="text-lg font-bold text-secondary/80 tracking-wider">
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
