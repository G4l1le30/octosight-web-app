"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QuizResponse, QuizResult } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

export default function QuizResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const attemptId = searchParams.get("attempt_id");
  const { user, loading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [nextModuleId, setNextModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!attemptId) {
      setError("No attempt ID provided.");
      setLoading(false);
      return;
    }

    try {
      // Fetch Quiz Structure
      const quizResponse = await fetch(`/api/v1/education/modules/${moduleId}/quiz`);
      if (!quizResponse.ok) {
        throw new Error("Failed to fetch quiz structure.");
      }
      const quizData = await quizResponse.json();
      setQuiz(quizData);

      // Fetch all modules to find the next one
      const modulesResponse = await fetch(`/api/v1/education/modules`);
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        const currentMod = modulesData.find((m: any) => m.id === moduleId);
        if (currentMod) {
          const nextMod = modulesData.find((m: any) => m.order_index === currentMod.order_index + 1);
          if (nextMod) setNextModuleId(nextMod.id);
        }
      }

      // Fetch specific attempt
      const attemptResponse = await fetch(`/api/v1/education/modules/${moduleId}/quiz-attempts/${attemptId}`);
      if (!attemptResponse.ok) {
        throw new Error("Failed to fetch attempt details.");
      }
      const attemptData = await attemptResponse.json();
      
      setResult({
        score: attemptData.score,
        total_questions: quizData.questions.length,
        correct_answers: 0, // Not strictly needed for this UI
        passed: attemptData.passed,
        questions_with_explanations: JSON.parse(attemptData.details),
        attempt_id: attemptData.id
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleId, attemptId]);

  useEffect(() => {
    if (user && moduleId) {
      fetchData();
    }
  }, [user, moduleId, fetchData]);

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (!user) return <AuthRequired description="Please log in to view results." />;

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
      <p className="text-secondary font-medium">Loading evaluation results...</p>
    </div>
  );

  if (error || !quiz || !result) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-md">
      <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
        <AlertCircle className="size-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to Load Result</h2>
        <p className="text-sm font-medium opacity-80">{error || "Result not found"}</p>
      </div>
      <Button onClick={() => router.push(`/edu/${moduleId}`)} variant="outline" className="gap-2">
        <ArrowLeft className="size-4" /> Back to Module
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/edu/${moduleId}`)}
            className="p-2 rounded-xl border border-neutral-border hover:bg-neutral-page transition-all text-secondary/60 hover:text-primary group shadow-sm"
          >
            <ArrowLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-secondary">Evaluation Result</h1>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in zoom-in duration-500">
        <div className={`mb-10 p-8 rounded-2xl border text-center ${
          result.passed ? "bg-green-50 border-green-200 shadow-sm" : "bg-red-50 border-red-200 shadow-sm"
        }`}>
          {result.passed ? (
            <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="size-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className="text-5xl font-bold mb-2 text-secondary">
            {Math.round(result.score / 10)}
          </h2>
          <p className={`font-bold mb-6 ${result.passed ? "text-green-700" : "text-red-700"}`}>
            {result.passed 
              ? "Excellent! You passed the evaluation." 
              : "You didn't reach the 70% passing score."}
          </p>
          <div className="flex gap-4 justify-center">
            {result.passed ? (
              <div className="flex flex-wrap justify-center gap-4">
                {nextModuleId && (
                  <Button 
                    onClick={() => router.push(`/edu/${nextModuleId}`)}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-5 text-lg shadow-sm"
                  >
                    Next Module <ArrowRight className="size-5" />
                  </Button>
                )}
                <Button 
                  onClick={() => router.push("/edu")}
                  variant="outline"
                  className="bg-white border-neutral-border text-secondary hover:border-green-500 gap-2 px-8 py-5 text-lg shadow-sm transition-colors"
                >
                  Back to Modules
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={() => router.push(`/edu/${moduleId}/quiz`)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Retake Quiz
                </Button>
                <Button onClick={() => router.push(`/edu/${moduleId}`)} variant="outline">
                  View Syllabus
                </Button>
              </>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-secondary mb-6">Review Your Answers</h3>
        <div className="space-y-6">
          {quiz.questions.map((q, idx) => {
            const res = result.questions_with_explanations[idx];
            return (
              <div key={idx} className={`p-6 rounded-2xl border-2 ${res.is_correct ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"}`}>
                <h4 className="font-bold text-secondary mb-4 text-lg">
                  <span className={`mr-2 ${res.is_correct ? "text-green-600" : "text-red-600"}`}>{idx + 1}.</span>
                  {q.question}
                </h4>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = oIdx === res.selected_answer_index;
                    if (!isSelected) return null;

                    return (
                      <div 
                        key={oIdx} 
                        className={`p-4 rounded-xl border-2 text-sm font-medium flex items-center justify-between ${
                          res.is_correct 
                            ? "bg-green-100 border-green-200 text-green-800" 
                            : "bg-red-100 border-red-200 text-red-800"
                        }`}
                      >
                        <span>Your Answer: {opt}</span>
                        {res.is_correct ? <CheckCircle2 className="size-5" /> : <XCircle className="size-5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
