"use client";

interface PointsCounterProps {
  points: number;
  level: number;
}

export default function PointsCounter({ points, level }: PointsCounterProps) {
  const pointsForNextLevel = level * 100;
  const progress = Math.min((points % 100) / 100, 1);

  return (
    <div className="bg-white border border-neutral-border rounded-lg md:rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <div>
          <p className="text-sm md:text-base font-semibold text-secondary">Total Points</p>
          <p className="text-2xl md:text-3xl font-bold text-secondary">{points}</p>
        </div>
        <div className="text-right">
          <p className="text-sm md:text-base font-semibold text-secondary">Level</p>
          <p className="text-2xl md:text-3xl font-bold text-primary">{level}</p>
        </div>
      </div>
      <div className="w-full rounded-full bg-neutral-border h-1.5 md:h-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="text-xs md:text-sm text-secondary/60 mt-0.5 md:mt-1">
        {pointsForNextLevel - points} points to Level {level + 1}
      </p>
    </div>
  );
}