"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { EducationModuleWithProgress, QuizAttempt } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

// Modular Components
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Quiz Resume state
  const [savedQuiz, setSavedQuiz] = useState<{
    answers: number[];
    timeLeft: number;
    answeredCount: number;
  } | null>(null);

  const [nextModuleId, setNextModuleId] = useState<string | null>(null);
  
  const fetchModule = useCallback(async () => {
    try {
      // Fetch current module
      const response = await fetch(`/api/v1/education/modules/${moduleId}`);
      if (!response.ok) {
        throw new Error("Module not found or locked");
      }
      const data = await response.json();
      setMod(data);

      // Fetch all modules to find the next one
      const allRes = await fetch(`/api/v1/education/modules`);
      if (allRes.ok) {
        const allData = await allRes.json();
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
    if (user && moduleId) {
      fetchModule();
      
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

          setSavedQuiz({
            answers,
            timeLeft,
            answeredCount
          });
        } else {
          setSavedQuiz(null);
        }
      };

      checkSavedProgress();
      const interval = setInterval(checkSavedProgress, 1000);
      return () => clearInterval(interval);
    }
  }, [user, moduleId, fetchModule]);

  const handleArticleClick = async (articleId: string, url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");

    if (mod) {
      const updatedArticles = mod.articles.map(a => 
        a.id === articleId ? { ...a, is_read: true } : a
      );
      setMod({ ...mod, articles: updatedArticles });
    }

    try {
      await fetch(`/api/v1/education/articles/${articleId}/read`, {
        method: "POST"
      });
    } catch (err) {
      console.error("Failed to mark article as read:", err);
    }
  };

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (!user) return <AuthRequired description="Please log in to access the module." />;

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
      <p className="text-secondary font-medium">Loading module...</p>
    </div>
  );

  if (error || !mod) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-md">
      <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
        <AlertCircle className="size-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm font-medium opacity-80">{error}</p>
      </div>
      <Button onClick={() => router.push("/edu")} variant="outline" className="gap-2">
        <ArrowLeft className="size-4" /> Back to E-Learning
      </Button>
    </div>
  );

  const isLocked = mod.status === "LOCKED";
  const isCompleted = mod.status === "COMPLETED" || (mod.quiz_score !== null && mod.quiz_score !== undefined && mod.quiz_score >= 70);
  const completedArticles = mod.articles.filter(a => a.is_read).length;
  const totalArticles = mod.articles.length;
  const allMaterialsFinished = completedArticles === totalArticles;
  const hasAttempted = (mod.quiz_attempts_history || []).length > 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/edu")}
          className="p-2 rounded-xl border border-neutral-border hover:bg-neutral-page transition-all text-secondary/60 hover:text-primary group shadow-sm"
        >
          <ArrowLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <h1 className="text-3xl font-bold text-secondary">{mod.title}</h1>
      </div>

      <ModuleHeader module={mod} />

      <MaterialList 
        articles={mod.articles}
        isLocked={isLocked}
        onArticleClick={handleArticleClick}
        completedArticles={completedArticles}
        totalArticles={totalArticles}
        isCompleted={isCompleted}
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
          // If not continuing a saved quiz, clear any old persistence to ensure a fresh start
          if (!savedQuiz) {
            localStorage.removeItem(`octo_quiz_${mod.id}_answers`);
            localStorage.removeItem(`octo_quiz_${mod.id}_step`);
            localStorage.removeItem(`octo_quiz_${mod.id}_end_time`);
          }
          router.push(`/edu/${mod.id}/quiz`);
        }}
        onResetQuiz={() => {
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