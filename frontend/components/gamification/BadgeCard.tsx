"use client";

interface BadgeCardProps {
  name: string;
  description: string;
  icon_url?: string;
  earned: boolean;
  points: number;
}

export default function BadgeCard({ name, description, icon_url, earned, points }: BadgeCardProps) {
  return (
    <div className={`relative p-4 rounded-xl border text-center transition-all ${earned ? "bg-white border-primary/30 shadow-sm" : "bg-neutral-page border-neutral-border opacity-60"}`}>
      <div className="text-2xl md:text-3xl mb-1.5 md:mb-2">{icon_url || (earned ? "🏆" : "🔒")}</div>
      <h4 className="text-xs md:text-sm font-bold text-secondary">{name}</h4>
      <p className="text-xs text-secondary/60 mt-0.5 md:mt-1">{description}</p>
      <span className="inline-block mt-1.5 md:mt-2 text-xs font-bold px-1.5 md:px-2 py-0.5 rounded bg-primary/10 text-primary">{points} pts</span>
      {earned && <span className="absolute top-2 right-2 text-xs text-risk-low">✓</span>}
    </div>
  );
}