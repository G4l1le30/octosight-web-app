"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { EducationModuleWithProgress } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ArrowLeft, AlertCircle, Home, ChevronRight, BarChart3 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ModuleHeader } from "@/components/education/ModuleHeader";
import { MaterialList } from "@/components/education/MaterialList";
import { QuizActionCard } from "@/components/education/QuizActionCard";
import { QuizHistory } from "@/components/education/QuizHistory";

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [mod, setMod] = useState<EducationModuleWithProgress | null>(null);
  const [allModules, setAllModules] = useState<EducationModuleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readingArticleId, setReadingArticleId] = useState<string | null>(null);
  const [readingTimeLeft, setReadingTimeLeft] = useState<number | undefined>(undefined);

  const [savedQuiz, setSavedQuiz] = useState<{
    answers: number[];
    timeLeft: number;
    answeredCount: number;
  } | null>(null);

  const [nextModuleId, setNextModuleId] = useState<string | null>(null);

  const fetchModule = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}`);
      if (!response.ok) {
        throw new Error("Module not found or locked");
      }
      const data = await response.json();
      setMod(data);

      const allRes = await fetch(`/api/v1/education/modules`);
      if (allRes.ok) {
        const allData = await allRes.json();
        setAllModules(allData);
        const next = allData.find((m: any) => m.order_index === data.order_index + 1);
        if (next) setNextModuleId(next.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (moduleId) fetchModule();
  }, [moduleId, fetchModule]);

  useEffect(() => {
    if (!user || !moduleId) return;

    const checkSavedProgress = () => {
      const savedAnswers = localStorage.getItem(`octo_quiz_${moduleId}_answers`);
      const savedEndTime = localStorage.getItem(`octo_quiz_${moduleId}_end_time`);

      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers) as number[];
        const answeredCount = answers.filter(a => a !== -1).length;
        let timeLeft = 0;
        if (savedEndTime) {
          timeLeft = Math.max(0, Math.floor((parseInt(savedEndTime) - Date.now()) / 1000));
        }
        setSavedQuiz({ answers, timeLeft, answeredCount });
      } else {
        setSavedQuiz(null);
      }
    };

    checkSavedProgress();
    const interval = setInterval(checkSavedProgress, 1000);
    return () => clearInterval(interval);
  }, [user, moduleId]);

  const handleArticleClick = async (articleId: string) => {
    router.push(`/article/${articleId}`);
  };

  const completedModulesCount = allModules.filter((m) => m.status === "COMPLETED").length;
  const totalModulesCount = allModules.length;

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-10 text-primary mx-auto mb-3" />
      <p className="text-secondary font-semibold text-lg">Loading module...</p>
    </div>
  );

  if (error || !mod) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-xl">
      <div className="bg-neutral-page text-secondary p-6 md:p-8 rounded-2xl border border-neutral-border mb-6">
        <AlertCircle className="size-14 mx-auto mb-4 text-secondary-light" />
        <h2 className="text-xl md:text-2xl font-bold mb-2">Module Not Found</h2>
        <p className="text-base font-medium opacity-80">{error}</p>
      </div>
      <Button onClick={() => router.push("/edu")} variant="outline" className="gap-2 text-base">
        <ArrowLeft className="size-4" /> Back to Learning Hub
      </Button>
    </div>
  );

  const isLocked = false;
  const isCompleted = mod.status === "COMPLETED" || (mod.quiz_score !== null && mod.quiz_score !== undefined && mod.quiz_score >= 70);
  const completedArticles = mod.articles.filter(a => a.is_read).length;
  const totalArticles = mod.articles.length;
  const allMaterialsFinished = completedArticles === totalArticles;
  const hasAttempted = (mod.quiz_attempts_history || []).length > 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm md:text-base font-semibold text-secondary-light mb-8">
        <button onClick={() => router.push("/edu")} className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="hidden sm:inline">Learning Hub</span>
        </button>
        <ChevronRight className="size-4" />
        <span className="text-primary truncate max-w-xs">{mod.title}</span>
      </nav>

      {/* Learning Progress Overview */}
      {user && totalModulesCount > 0 && (
        <div className="bg-white rounded-2xl border border-neutral-border p-5 md:p-6 mb-8 md:mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-neutral-page flex items-center justify-center">
                <BarChart3 className="size-6 text-secondary" />
              </div>
              <div>
                <p className="font-bold text-base text-secondary">Your Learning Progress</p>
                <p className="text-sm text-secondary-light">{completedModulesCount} of {totalModulesCount} modules completed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex-1 md:w-48 h-2.5 bg-neutral-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary transition-all duration-500 rounded-full"
                  style={{ width: `${totalModulesCount > 0 ? (completedModulesCount / totalModulesCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-lg font-bold text-secondary shrink-0">
                {totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Image */}
      {mod.image_url && (
        <div className="rounded-2xl overflow-hidden mb-6 md:mb-8 bg-neutral-page shadow-sm relative h-56 md:h-72 lg:h-80">
          <Image
            src={mod.image_url}
            alt={mod.title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      )}

      {/* Title */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-secondary">{mod.title}</h1>
      </div>

      <ModuleHeader module={mod} />

      <MaterialList
        articles={mod.articles}
        isLocked={isLocked}
        onArticleClick={handleArticleClick}
        completedArticles={completedArticles}
        totalArticles={totalArticles}
        isCompleted={isCompleted}
        readingArticleId={readingArticleId}
        readingTimeLeft={readingTimeLeft ?? undefined}
      />

      <QuizActionCard
        moduleId={mod.id}
        isCompleted={isCompleted}
        isLocked={isLocked}
        allMaterialsFinished={allMaterialsFinished}
        quizScore={mod.quiz_score}
        savedQuiz={savedQuiz}
        hasAttempted={hasAttempted}
        onStartQuiz={() => {
          if (!user) { router.push(`/login?redirect=/edu/${mod.id}`); return; }
          if (!savedQuiz) {
            localStorage.removeItem(`octo_quiz_${mod.id}_answers`);
            localStorage.removeItem(`octo_quiz_${mod.id}_step`);
            localStorage.removeItem(`octo_quiz_${mod.id}_end_time`);
          }
          router.push(`/edu/${mod.id}/quiz`);
        }}
        onResetQuiz={() => {
          if (!user) { router.push(`/login?redirect=/edu/${mod.id}`); return; }
          if (confirm("Are you sure you want to discard your current progress and start fresh?")) {
            localStorage.removeItem(`octo_quiz_${mod.id}_answers`);
            localStorage.removeItem(`octo_quiz_${mod.id}_step`);
            localStorage.removeItem(`octo_quiz_${mod.id}_end_time`);
            setSavedQuiz(null);
            router.push(`/edu/${mod.id}/quiz`);
          }
        }}
        onNextModule={nextModuleId ? () => router.push(`/edu/${nextModuleId}`) : undefined}
      />

      <QuizHistory
        history={mod.quiz_attempts_history || []}
        onViewAttempt={(attemptId) => router.push(`/edu/${mod.id}/result?attempt_id=${attemptId}`)}
      />
    </div>
  );
}
