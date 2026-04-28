import React from "react";

const Stats: React.FC = () => {
  const statsData = [
    { value: "1,200+", label: "Incidents Tracked" },
    { value: "85-90%", label: "Detection Rate" },
    { value: "< 1 Hour", label: "Response SLA" },
  ];

  return (
    <section className="py-16 bg-neutral-page">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {statsData.map((stat, index) => (
          <div key={index} className="card p-8">
            <p className="text-primary text-4xl font-black mb-2">{stat.value}</p>
            <p className="font-semibold opacity-60">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
