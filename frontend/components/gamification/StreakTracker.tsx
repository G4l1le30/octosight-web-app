"use client";

interface StreakTrackerProps {
  current: number;
  longest: number;
}

export default function StreakTracker({ current, longest }: StreakTrackerProps) {
  return (
    <div className="bg-white border border-neutral-border rounded-lg md:rounded-xl p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
        <span className="text-xl md:text-2xl">🔥</span>
        <div>
          <p className="text-sm md:text-base font-semibold text-secondary">Current Streak</p>
          <p className="text-xl md:text-2xl font-bold text-secondary">{current} day{current !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="text-xs md:text-sm text-secondary/60">
        Longest streak: <span className="font-bold">{longest} day{longest !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}