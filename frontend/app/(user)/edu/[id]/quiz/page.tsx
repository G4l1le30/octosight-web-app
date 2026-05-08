"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { QuizResponse, QuizQuestion, QuizResult } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}/quiz`);
      if (!response.ok) {
        throw new Error("Gagal mengambil quiz atau modul masih terkunci.");
      }
      const data = await response.json();
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(-1));
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

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (result) return; // Cannot change answers after submission
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      setError("Silakan jawab semua pertanyaan terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}/submit-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim jawaban quiz.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (!user) return <AuthRequired description="Please log in to take the quiz." />;

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
      <p className="text-secondary font-medium">Gemini sedang menyusun soal quiz...</p>
    </div>
  );

  if (error && !quiz) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-md">
      <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
        <AlertCircle className="size-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Gagal Memuat Quiz</h2>
        <p className="text-sm font-medium opacity-80">{error}</p>
      </div>
      <Button onClick={() => router.push(`/edu/${moduleId}`)} variant="outline" className="gap-2">
        <ArrowLeft className="size-4" /> Kembali
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push(`/edu/${moduleId}`)}
          className="p-2 rounded-xl border border-neutral-border hover:bg-neutral-page transition-all text-secondary/60 hover:text-primary group shadow-sm"
        >
          <ArrowLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-secondary">Evaluasi Modul</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-bold text-secondary/60">
              Jawab {quiz?.questions.length} pertanyaan di bawah ini
            </p>
            <span className="text-[10px] font-black px-2 py-0.5 bg-secondary text-white rounded-md uppercase tracking-tighter">
              AI Generated
            </span>
          </div>
        </div>
      </div>

      {error && result === null && (
        <div className="mb-6 p-4 bg-risk-high/10 border border-risk-high/20 text-risk-high rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      {result && (
        <div className={`mb-10 p-8 rounded-2xl border text-center animate-in fade-in zoom-in duration-500 ${
          result.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          {result.passed ? (
            <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="size-16 text-red-500 mx-auto mb-4" />
          )}
          <h2 className={`text-3xl font-black mb-2 ${result.passed ? "text-green-800" : "text-red-800"}`}>
            Skor Anda: {result.score.toFixed(0)}%
          </h2>
          <p className={`font-medium mb-6 ${result.passed ? "text-green-700" : "text-red-700"}`}>
            {result.passed 
              ? "Selamat! Anda telah menguasai materi ini dan modul selanjutnya telah terbuka." 
              : "Maaf, skor minimal untuk lulus adalah 70%. Silakan pelajari materi kembali dan coba lagi."}
          </p>
          <Button 
            onClick={() => router.push(result.passed ? "/edu" : `/edu/${moduleId}`)}
            className={result.passed ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
          >
            {result.passed ? "Kembali ke Daftar Modul" : "Pelajari Ulang Materi"}
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {quiz?.questions.map((q, qIdx) => {
          const res = result?.questions_with_explanations[qIdx];
          
          return (
            <div key={qIdx} className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-secondary mb-4">
                <span className="text-primary mr-2">{qIdx + 1}.</span>
                {q.question}
              </h3>
              
              <div className="space-y-3">
                {q.options.map((opt, oIdx) => {
                  let btnClass = "border-neutral-border hover:bg-neutral-page text-secondary";
                  
                  if (result) {
                    if (res?.correct_answer_index === oIdx) {
                      btnClass = "border-green-500 bg-green-50 text-green-800"; // Jawaban benar
                    } else if (res?.selected_answer_index === oIdx) {
                      btnClass = "border-red-500 bg-red-50 text-red-800"; // Jawaban salah
                    } else {
                      btnClass = "border-neutral-border opacity-50"; // Opsi lainnya
                    }
                  } else if (answers[qIdx] === oIdx) {
                    btnClass = "border-primary bg-primary/5 text-primary shadow-sm"; // Dipilih user (belum submit)
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={result !== null}
                      onClick={() => handleSelectOption(qIdx, oIdx)}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all font-medium text-sm ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {res && (
                <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${
                  res.is_correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}>
                  <p className="font-bold mb-1">Penjelasan:</p>
                  <p>{res.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!result && (
        <div className="mt-10 flex justify-end">
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="px-8 py-6 text-lg gap-2"
          >
            {submitting && <Loader2 className="size-5 animate-spin" />}
            {submitting ? "Memproses..." : "Submit Jawaban"}
          </Button>
        </div>
      )}
    </div>
  );
}