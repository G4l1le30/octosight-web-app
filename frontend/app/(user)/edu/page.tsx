"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EducationModuleWithProgress } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  Lock,
  CheckCircle2,
  BookOpen,
  Trophy,
  Clock,
  ChevronRight,
  Award,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function EducationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [modules, setModules] = useState<EducationModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

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
      <div className="container mx-auto px-3 md:px-4 py-24 md:py-32 text-center">
        <Loader2 className="animate-spin size-12 text-primary mx-auto mb-3 md:mb-4" />
      </div>
    );
  }

  let totalPercentage = 0;
  modules.forEach((mod) => {
    const moduleTotal = (mod.articles?.length || 0) + 1;
    let moduleCompleted = mod.articles?.filter((a) => a.is_read).length || 0;
    const moduleIsPassed =
      mod.status === "COMPLETED" ||
      (mod.quiz_score !== null &&
        mod.quiz_score !== undefined &&
        mod.quiz_score >= 70);
    if (moduleIsPassed) {
      moduleCompleted += 1;
    }
    totalPercentage += moduleCompleted / moduleTotal;
  });

  const progressPercent =
    modules.length > 0
      ? Math.round((totalPercentage / modules.length) * 100)
      : 0;
  const completedModulesCount = modules.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const totalModulesCount = modules.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-3 md:px-4 py-8 md:py-12 max-w-6xl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 md:gap-6 mb-8 md:mb-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-primary-dark to-primary-light bg-clip-text text-transparent">Security E-Learning</h1>
          <p className="text-sm md:text-base text-secondary-light leading-relaxed">
            Improve your digital literacy with bite-sized security modules
            designed to prevent fraud and phishing.
          </p>
        </div>
        {user && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 md:p-5 rounded-xl md:rounded-2xl border border-primary/10 flex items-center gap-3 md:gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs font-semibold text-secondary tracking-wide">
                Learning Progress
              </p>
              <p className="text-lg md:text-xl font-bold text-primary">
                {completedModulesCount} / {totalModulesCount} Modules
              </p>
            </div>
            <div className="size-14 rounded-full border-[3px] border-primary/20 flex items-center justify-center text-base md:text-lg font-bold text-primary relative overflow-hidden bg-white">
              <div
                className="absolute bottom-0 left-0 right-0 bg-primary/15"
                style={{ height: `${progressPercent}%` }}
              />
              <span className="relative z-10">{progressPercent}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {user && totalModulesCount > 0 && (
        <div className="mb-10 md:mb-14">
          <div className="w-full h-2 md:h-2.5 bg-neutral-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs md:text-sm text-secondary-light mt-1.5 md:mt-2 font-medium">
            {progressPercent < 100
              ? `${progressPercent}% complete, keep going!`
              : "All modules completed! Great work!"}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="max-w-6xl mx-auto mt-8 md:mt-16">
        <div className="relative">
          {/* Vertical timeline line */}
          {!loading && (
            <div className="absolute left-[24px] md:left-1/2 top-4 bottom-4 w-0.5 bg-neutral-border/80 md:-translate-x-1/2 z-0 hidden md:block" />
          )}

          <div className="space-y-12 md:space-y-16">
            {loading ? (
              <div className="py-14 md:py-20 text-center">
                <Loader2 className="size-10 text-primary animate-spin mx-auto mb-3 md:mb-4" />
                <p className="text-secondary font-semibold text-base md:text-lg">
                  Loading timeline...
                </p>
              </div>
            ) : (
              modules.map((mod, index) => {
                const isLocked = false;
                const isCompleted =
                  mod.status === "COMPLETED" ||
                  (mod.quiz_score !== null &&
                    mod.quiz_score !== undefined &&
                    mod.quiz_score >= 70);
                const titleParts = mod.title.split(" - ");
                const subTitle = titleParts[1] || titleParts[0];
                const completedArticles = mod.articles.filter(
                  (a) => a.is_read,
                ).length;
                const totalArticles = mod.articles.length;

                return (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className={`relative flex flex-col ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} items-center group`}
                  >
                    {/* Card Column */}
                    <div className={`w-full md:w-1/2 z-10 ${index % 2 === 0 ? "pr-10 md:pr-12" : "pl-10 md:pl-12"}`}>
                      <div
                        onClick={
                          isLocked
                            ? undefined
                            : () => router.push(`/edu/${mod.id}`)
                        }
                        className={`bg-white rounded-2xl border overflow-hidden transition-all relative ${isLocked
                          ? "border-neutral-border bg-neutral-page/50 cursor-not-allowed"
                          : "border-neutral-border shadow-sm hover:border-primary hover:shadow-lg cursor-pointer"
                          }`}
                      >
                        {/* Module Image */}
                        {mod.image_url && !isLocked && (
                          <div className="h-44 md:h-48 bg-neutral-page overflow-hidden relative">
                            <Image
                              src={mod.image_url}
                              alt={mod.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 600px"
                            />
                          </div>
                        )}
                        {mod.image_url && isLocked && (
                          <div className="h-44 md:h-48 bg-neutral-page overflow-hidden relative">
                            <Image
                              src={mod.image_url}
                              alt={mod.title}
                              fill
                              className="object-cover opacity-40"
                              sizes="(max-width: 768px) 100vw, 600px"
                            />
                            <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
                              <Lock className="size-10 text-secondary/40" />
                            </div>
                          </div>
                        )}

                        <div className="p-5 md:p-6">
                          <div className="flex items-start justify-between mb-3 md:mb-4">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <BookOpen className="size-4 text-primary" />
                              <span className="text-xs font-bold text-secondary">
                                Step {mod.order_index}
                              </span>
                            </div>
                            <div
                              className={`px-2 py-1 rounded-md text-xs font-bold ${isLocked
                                ? "bg-neutral-border text-secondary/60"
                                : "bg-primary/10 text-primary"
                                }`}
                            >
                              {mod.level}
                            </div>
                          </div>

                          <h3
                            className={`text-lg md:text-xl font-bold mb-3 leading-tight ${isLocked ? "text-secondary/60" : "text-secondary"}`}
                          >
                            {mod.title}
                          </h3>

                          <div className="flex items-center justify-between mt-auto pt-3 md:pt-4 border-t border-neutral-border/50">
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold">
                              <div className="flex items-center gap-1 md:gap-1.5 text-secondary">
                                <Clock className="size-4 text-primary" />
                                <span>{mod.duration_mins} Mins</span>
                              </div>
                              <div className="flex items-center gap-1 md:gap-1.5 text-secondary">
                                <BookOpen className="size-4 text-primary" />
                                <span>{totalArticles} articles</span>
                              </div>
                              {isCompleted && mod.quiz_score !== undefined && (
                                <div className="flex items-center gap-1 md:gap-1.5 text-secondary">
                                  <Trophy className="size-4 text-primary" />
                                  <span>{mod.quiz_score.toFixed(0)}%</span>
                                </div>
                              )}
                            </div>

                            <span
                              className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${isLocked ? "text-secondary/40" : "text-primary"
                                }`}
                            >
                              {isLocked ? (
                                <>
                                  <Lock className="size-3" /> Locked
                                </>
                              ) : (
                                <>
                                  View Detail{" "}
                                  <ChevronRight className="size-3" />
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Progress strip at bottom */}
                        {user && !isLocked && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 md:h-1.5 bg-neutral-border/50">
                            {(() => {
                              const totalItems =
                                (mod.articles?.length || 0) + 1;
                              const completedItems =
                                (mod.articles?.filter((a) => a.is_read)
                                  .length || 0) + (isCompleted ? 1 : 0);
                              const percent =
                                (completedItems / totalItems) * 100;
                              return (
                                <div
                                  className={`h-full transition-all duration-500 ${isCompleted ? "bg-green-400" : "bg-primary"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Center Node */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center size-12 rounded-full bg-white border-4 border-neutral-border/30 shadow-sm z-20">
                      <div
                        className={`w-full h-full rounded-full flex items-center justify-center ${isCompleted
                          ? "bg-green-500 text-white"
                          : isLocked
                            ? "bg-neutral-border text-secondary/40"
                            : "bg-primary text-white"
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-5" />
                        ) : isLocked ? (
                          <Lock className="size-4" />
                        ) : (
                          <span className="font-bold text-xs md:text-sm">
                            {mod.order_index}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description Column */}
                    <div className={`w-full md:w-1/2 hidden md:flex flex-col justify-center py-3 md:py-4 ${index % 2 === 0 ? "pl-10 md:pl-12" : "pr-10 md:pr-12"}`}>
                      <h3
                        className={`text-xl font-bold mb-3 ${isLocked ? "text-secondary/60" : "text-secondary"}`}
                      >
                        {subTitle}
                      </h3>
                      <p
                        className={`font-medium leading-relaxed ${isLocked ? "text-secondary/40" : "text-secondary-light"}`}
                      >
                        {mod.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Continue Learning CTA */}
        {!loading && modules.length > 0 && (
          <div className="mt-12 md:mt-16 mb-6 md:mb-10 text-center border-t border-neutral-border pt-10 md:pt-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3">
              Ready to continue your journey?
            </h3>
            <p className="text-secondary-light text-sm md:text-base mb-6 md:mb-8 max-w-xl mx-auto">
              Pick up where you left off and keep improving your security
              awareness.
            </p>
            <Button
              size="lg"
              onClick={() => {
                if (!user) { router.push("/login?redirect=/edu"); return; }
                const inProgressMod = modules.find(
                  (m) => m.status === "IN_PROGRESS",
                );
                const firstLockedMod = modules.find(
                  (m) => m.status === "LOCKED",
                );
                const targetMod =
                  inProgressMod ||
                  firstLockedMod ||
                  modules[0];
                if (targetMod) router.push(`/edu/${targetMod.id}`);
              }}
              className="px-10 md:px-12 text-base md:text-lg"
            >
              Continue Learning <ChevronRight className="size-5" />
            </Button>
          </div>
        )}

        {/* All completed CTA */}
        {!loading &&
          completedModulesCount === totalModulesCount &&
          totalModulesCount > 0 && (
            <div className="mt-6 md:mt-8 text-center bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl md:rounded-2xl border border-primary/10 p-8 md:p-10">
              <Award className="size-14 text-primary mx-auto mb-3 md:mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold mb-1.5 md:mb-2">
                Congratulations!
              </h3>
              <p className="text-secondary-light text-sm md:text-base max-w-lg mx-auto mb-4 md:mb-6">
                You have completed all learning modules. You now have a strong
                foundation in digital security awareness.
              </p>
              <div className="flex items-center justify-center gap-0.5 md:gap-1 text-primary font-semibold">
                <Sparkles className="size-5" />
                <span>Stay safe online!</span>
              </div>
            </div>
          )}
      </div>
    </motion.div>

  );
}
