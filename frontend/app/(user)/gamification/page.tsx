"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Award, Flame, Star, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  points: number;
}

export default function GamificationPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    total_points: number;
    achievements: Achievement[];
    streak: { current: number; longest: number };
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/gamification/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/gamification/leaderboard").then((r) => (r.ok ? r.json() : { leaderboard: [] })),
    ])
      .then(([profileData, lbData]) => {
        setProfile(profileData);
        setLeaderboard(lbData.leaderboard || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const iconMap: Record<string, React.ReactNode> = {
    flag: <span className="text-lg">🚩</span>,
    brain: <span className="text-lg">🧠</span>,
    star: <span className="text-lg">⭐</span>,
    book: <span className="text-lg">📖</span>,
    flame: <span className="text-lg">🔥</span>,
    award: <span className="text-lg">🏆</span>,
    sun: <span className="text-lg">🌅</span>,
  };

  if (loading) {
    return <div className="p-20 text-center font-bold opacity-40">Loading...</div>;
  }

  return (
    <div className="bg-neutral-page min-h-screen">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Achievements & Leaderboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6 text-center">
            <Trophy className="size-8 text-amber-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-secondary">{profile?.total_points ?? 0}</p>
            <p className="text-sm font-medium text-secondary/60">Total Points</p>
          </div>
          <div className="card p-6 text-center">
            <Award className="size-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-secondary">{profile?.achievements?.length ?? 0}</p>
            <p className="text-sm font-medium text-secondary/60">Badges Earned</p>
          </div>
          <div className="card p-6 text-center">
            <Flame className="size-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-secondary">{profile?.streak?.current ?? 0}</p>
            <p className="text-sm font-medium text-secondary/60">Day Streak</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Achievements */}
          <div>
            <h2 className="text-lg font-bold mb-4">Your Badges</h2>
            {profile?.achievements && profile.achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {profile.achievements.map((ach, i) => (
                  <div key={i} className="card p-4 flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {iconMap[ach.icon] || <Star className="size-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-secondary truncate">{ach.name}</p>
                      <p className="text-xs text-secondary/60 truncate">{ach.description}</p>
                      <p className="text-xs font-bold text-primary mt-1">+{ach.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center opacity-60">
                <Award className="size-10 mx-auto mb-3 text-secondary/30" />
                <p className="text-sm font-bold text-secondary/60">No badges yet</p>
                <p className="text-xs text-secondary/40 mt-1">Complete modules and submit reports to earn badges</p>
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-lg font-bold mb-4">Leaderboard</h2>
            {leaderboard.length > 0 ? (
              <div className="card overflow-hidden">
                {leaderboard.map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 border-b border-neutral-border last:border-0",
                      entry.user_id === user?.id && "bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-neutral-page text-secondary/60"
                    )}>
                      {entry.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-secondary truncate">{entry.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{entry.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center opacity-60">
                <Trophy className="size-10 mx-auto mb-3 text-secondary/30" />
                <p className="text-sm font-bold text-secondary/60">No leaderboard data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
