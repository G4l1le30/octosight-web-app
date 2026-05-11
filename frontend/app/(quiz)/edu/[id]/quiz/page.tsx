"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizResponse } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, AlertCircle, ArrowLeft, Sparkles, BookOpen, Brain, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

import { QuizLoadingUI } from "@/components/education/quiz/QuizLoadingUI";
import { QuizQuestionCard } from "@/components/education/quiz/QuizQuestionCard";
import { QuizControls } from "@/components/education/quiz/QuizControls";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}/quiz`);
      if (!response.ok) {
        throw new Error("Failed to fetch quiz or module is still locked.");
      }
      const data = await response.json();
      setQuiz(data);
      
      const savedAnswers = localStorage.getItem(`octo_quiz_${moduleId}_answers`);
      const savedStep = localStorage.getItem(`octo_quiz_${moduleId}_step`);
      let savedEndTime = localStorage.getItem(`octo_quiz_${moduleId}_end_time`);
      
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        setAnswers(parsedAnswers);
        
        const firstUnanswered = parsedAnswers.findIndex((a: number) => a === -1);
        if (firstUnanswered !== -1) {
          setCurrentStep(firstUnanswered);
        } else if (savedStep) {
          setCurrentStep(parseInt(savedStep));
        }
      } else {
        setAnswers(new Array(data.questions.length).fill(-1));
      }
      
      if (!savedEndTime) {
        const endTime = Date.now() + 600000;
        localStorage.setItem(`octo_quiz_${moduleId}_end_time`, endTime.toString());
        savedEndTime = endTime.toString();
      }
      
      const remaining = Math.max(0, Math.floor((parseInt(savedEndTime) - Date.now()) / 1000));
      setTimeLeft(remaining);
      setTimerActive(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (user && moduleId) {
      fetchQuiz();
    }
  }, [user, moduleId, fetchQuiz]);

  const clearPersistence = useCallback(() => {
    localStorage.removeItem(`octo_quiz_${moduleId}_answers`);
    localStorage.removeItem(`octo_quiz_${moduleId}_step`);
    localStorage.removeItem(`octo_quiz_${moduleId}_end_time`);
  }, [moduleId]);

  const handleSelectOption = useCallback((optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = optionIndex;
    setAnswers(newAnswers);
  }, [answers, currentStep]);

  const handleSubmit = useCallback(async () => {
    if (answers.includes(-1) && timeLeft > 0) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    setTimerActive(false);

    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, questions: quiz?.questions ?? [] }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quiz answers.");
      }

      const data = await response.json();
      clearPersistence();
      router.push(`/edu/${moduleId}/result?attempt_id=${data.attempt_id}`);
    } catch (err: any) {
      setError(err.message);
      setTimerActive(true);
      setSubmitting(false);
    }
  }, [answers, timeLeft, moduleId, quiz, router, clearPersistence]);

  useEffect(() => {
    if (answers.length > 0) {
      localStorage.setItem(`octo_quiz_${moduleId}_answers`, JSON.stringify(answers));
    }
  }, [answers, moduleId]);

  useEffect(() => {
    localStorage.setItem(`octo_quiz_${moduleId}_step`, currentStep.toString());
  }, [currentStep, moduleId]);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        const endTime = localStorage.getItem(`octo_quiz_${moduleId}_end_time`);
        if (endTime) {
          const remaining = Math.max(0, Math.floor((parseInt(endTime) - Date.now()) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) {
            handleSubmit();
          }
        }
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, moduleId, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (!user) return <AuthRequired description="Please log in to take the quiz." />;

  if (loading) return <QuizLoadingUI />;

  if (error && !quiz) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-md">
      <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
        <AlertCircle className="size-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to Load Quiz</h2>
        <p className="text-sm font-medium opacity-80">{error}</p>
      </div>
      <Button onClick={() => router.push(`/edu/${moduleId}`)} variant="outline" className="gap-2">
        <ArrowLeft className="size-4" /> Back
      </Button>
    </div>
  );

  const currentQuestion = quiz?.questions[currentStep];
  const totalQuestions = quiz?.questions.length || 0;
  const isLastStep = currentStep === totalQuestions - 1;

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
            <h1 className="text-3xl font-bold text-secondary">Module Evaluation</h1>
            <p className="text-sm font-bold text-secondary mt-1">
              Question {currentStep + 1} of {totalQuestions}
            </p>
          </div>
        </div>
        
        {timerActive && (
          <div className={`px-4 py-2 rounded-full font-bold border-2 ${timeLeft < 60 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-neutral-100 text-secondary border-neutral-border/50"}`}>
            Time Left: {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-risk-high/10 border border-risk-high/20 text-risk-high rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
        {currentQuestion && (
          <QuizQuestionCard 
            question={currentQuestion.question}
            options={currentQuestion.options}
            selectedAnswer={answers[currentStep]}
            onSelectOption={handleSelectOption}
          />
        )}

        <QuizControls 
          currentStep={currentStep}
          totalQuestions={totalQuestions}
          isLastStep={isLastStep}
          selectedAnswer={answers[currentStep]}
          answers={answers}
          submitting={submitting}
          canSubmit={!answers.includes(-1) || timeLeft === 0}
          onPrevious={() => setCurrentStep(prev => prev - 1)}
          onNext={() => setCurrentStep(prev => prev + 1)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}