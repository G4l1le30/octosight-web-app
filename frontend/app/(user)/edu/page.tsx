"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EducationModuleWithProgress } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Lock, CheckCircle2, BookOpen } from "lucide-react";
import { AuthRequired } from "@/components/auth/AuthRequired";
import { Button } from "@/components/ui/Button";

export default function EducationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [modules, setModules] = useState<EducationModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchModules();
    }
  }, [user]);

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/v1/education/modules");
      if (response.ok) {
        const data = await response.json();
        setModules(data);
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
      </div>
    );
  }

  if (!user) {
    return <AuthRequired description="Please log in to access the security microlearning modules." />;
  }

  let totalPercentage = 0;

  modules.forEach((mod) => {
    const moduleTotal = (mod.articles?.length || 0) + 1;
    let moduleCompleted = mod.articles?.filter((a) => a.is_read).length || 0;
    const moduleIsPassed = mod.status === "COMPLETED" || (mod.quiz_score !== null && mod.quiz_score !== undefined && mod.quiz_score >= 70);
    if (moduleIsPassed) {
      moduleCompleted += 1;
    }
    totalPercentage += (moduleCompleted / moduleTotal);
  });

  const progressPercent = Math.round((totalPercentage / 8) * 100);
  const completedModulesCount = modules.filter((m) => m.status === "COMPLETED").length;
  const totalModulesCount = modules.length;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Security Microlearning</h1>
          <p className="font-medium text-secondary-light">
            Improve your digital literacy with bite-sized security modules
            designed to prevent fraud and phishing.
          </p>
        </div>
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-secondary">Learning Progress</p>
            <p className="text-xl font-bold text-primary">
              {completedModulesCount} / {totalModulesCount} Modules
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center text-lg font-bold text-primary relative overflow-hidden bg-white">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-primary/20" 
              style={{ height: `${progressPercent}%` }}
            />
            <span className="relative z-10">{progressPercent}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-16">
        <div className="relative">
          {/* Vertical Line */}
          {!loading && <div className="absolute left-[24px] md:left-1/2 top-4 bottom-4 w-0.5 bg-neutral-border/80 md:-translate-x-1/2 z-0 hidden md:block"></div>}

          <div className="space-y-16">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="size-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-secondary font-medium">Loading timeline...</p>
              </div>
            ) : (
              modules.map((mod, index) => {
                const isLocked = mod.status === "LOCKED";
                const isCompleted = mod.status === "COMPLETED" || (mod.quiz_score !== null && mod.quiz_score !== undefined && mod.quiz_score >= 70);

                // Splitting title if it uses the "Part 1 - Part 2" format
                const titleParts = mod.title.split(" - ");
                const subTitle = titleParts[1] || titleParts[0];

                return (
                  <div 
                    key={mod.id} 
                    className="relative flex flex-col md:flex-row items-center group"
                  >
                    {/* Left Column: The Card */}
                    <div className="w-full md:w-1/2 md:pr-12 z-10">
                      <div 
                        onClick={() => router.push(`/edu/${mod.id}`)}
                        className={`card bg-white p-6 cursor-pointer border hover:border-primary hover:shadow-lg transition-all overflow-hidden relative ${
                          isLocked ? "border-neutral-border bg-neutral-page/50" : "border-neutral-border shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="size-4 text-primary" />
                            <span className="text-xs font-bold text-secondary">Step {mod.order_index}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                            isLocked ? "bg-neutral-border text-secondary/60" :
                            "bg-primary/10 text-primary"
                          }`}>
                            {mod.level}
                          </div>
                        </div>

                        <h3 className={`text-xl font-bold mb-4 leading-tight ${isLocked ? "text-secondary" : "text-secondary"}`}>
                          {mod.title}
                        </h3>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-border/50">
                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-1.5 text-secondary">
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{mod.duration_mins} Mins</span>
                            </div>
                            
                            {isCompleted && mod.quiz_score !== undefined && (
                              <div className="flex items-center gap-1.5 text-secondary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                <span>{mod.quiz_score.toFixed(0)}%</span>
                              </div>
                            )}
                          </div>

                          <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                            isLocked ? "text-secondary/40" : "text-primary group-hover:bg-risk-high/10"
                          }`}>
                            {isLocked ? (
                              <><Lock className="size-3" /> Locked</>
                            ) : (
                              <>View Detail -&gt;</>
                            )}
                          </span>
                        </div>

                        {/* Progress strip at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-border/50">
                          {(() => {
                            const totalItems = (mod.articles?.length || 0) + 1;
                            const completedItems = (mod.articles?.filter(a => a.is_read).length || 0) + (isCompleted ? 1 : 0);
                            const percent = (completedItems / totalItems) * 100;
                            return (
                              <div 
                                className={`h-full transition-all duration-500 ${isLocked ? "bg-transparent" : "bg-primary"}`} 
                                style={{ width: `${percent}%` }}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Center Node */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full bg-neutral-page border-4 border-white shadow-sm z-20">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${
                        isLocked ? "bg-neutral-border text-secondary/40" :
                        "bg-primary text-white"
                      }`}>
                        {isCompleted ? <CheckCircle2 className="size-5" /> : 
                         isLocked ? <Lock className="size-4" /> : 
                         <span className="font-bold text-sm">{mod.order_index}</span>}
                      </div>
                    </div>

                    {/* Right Column: Title & Description */}
                    <div className="w-full md:w-1/2 md:pl-12 hidden md:flex flex-col justify-center py-4">
                      <h3 className={`text-xl font-bold mb-3 ${isLocked ? "text-secondary" : "text-secondary"}`}>
                        {subTitle}
                      </h3>
                      <p className={`font-medium leading-relaxed ${isLocked ? "text-secondary/50" : "text-secondary-light"}`}>
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Continue Learning Action */}
        {!loading && modules.length > 0 && (
          <div className="mt-16 mb-10 text-center border-t border-neutral-border pt-12">
            <h3 className="text-3xl font-bold mb-4">Ready to continue your journey?</h3>
            <p className="text-secondary mb-8 max-w-xl mx-auto">
              Pick up where you left off and keep improving your security awareness.
            </p>
            <Button 
              size="lg"
              onClick={() => {
                const inProgressMod = modules.find(m => m.status === "IN_PROGRESS");
                const firstLockedMod = modules.find(m => m.status === "LOCKED");
                const targetMod = inProgressMod || firstLockedMod || modules[modules.length - 1];
                if (targetMod) router.push(`/edu/${targetMod.id}`);
              }} 
              className="px-12"
            >
              Continue Learning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
