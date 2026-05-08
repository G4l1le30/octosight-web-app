"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { EducationModuleWithProgress } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, ArrowLeft, ExternalLink, Play, BookOpen, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthRequired } from "@/components/auth/AuthRequired";

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const [mod, setMod] = useState<EducationModuleWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchModule = useCallback(async () => {
    try {
      const response = await fetch(`/api/v1/education/modules/${moduleId}`);
      if (!response.ok) {
        throw new Error("Module not found or locked");
      }
      const data = await response.json();
      setMod(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    if (user && moduleId) {
      fetchModule();
    }
  }, [user, moduleId, fetchModule]);

  if (authLoading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
    </div>
  );

  if (!user) return <AuthRequired description="Please log in to access the module." />;

  if (loading) return (
    <div className="container mx-auto px-4 py-32 text-center">
      <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
      <p className="text-secondary font-medium">Memuat modul...</p>
    </div>
  );

  if (error || !mod) return (
    <div className="container mx-auto px-4 py-32 text-center max-w-md">
      <div className="bg-risk-high/10 text-risk-high p-6 rounded-2xl border border-risk-high/20 mb-6">
        <AlertCircle className="size-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
        <p className="text-sm font-medium opacity-80">{error}</p>
      </div>
      <Button onClick={() => router.push("/edu")} variant="outline" className="gap-2">
        <ArrowLeft className="size-4" /> Kembali ke Edukasi
      </Button>
    </div>
  );

  const isCompleted = mod.status === "COMPLETED";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/edu")}
          className="p-2 rounded-xl border border-neutral-border hover:bg-neutral-page transition-all text-secondary/60 hover:text-primary group shadow-sm"
        >
          <ArrowLeft className="size-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <span className={`text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block ${
            isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}>
            Level: {mod.level}
          </span>
          <h1 className="text-3xl font-black text-secondary">{mod.title}</h1>
        </div>
      </div>

      <div className="bg-neutral-page rounded-2xl p-8 border border-neutral-border mb-8 shadow-sm">
        <p className="text-secondary-light leading-relaxed font-medium mb-6">
          {mod.description}
        </p>
        <div className="flex gap-6 text-sm font-bold text-secondary">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <span>Estimasi: {mod.duration_mins} Menit</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <span>{mod.articles.length} Artikel</span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-secondary mb-6">Materi Pembelajaran</h2>
      <div className="space-y-4 mb-12">
        {mod.articles.map((article, idx) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border border-neutral-border hover:border-primary hover:shadow-md rounded-xl p-6 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors mb-2">
                  {idx + 1}. {article.title}
                </h3>
                <p className="text-sm text-secondary-light font-medium mb-4 line-clamp-2">
                  {article.description}
                </p>
                <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                  <span>Oleh: {article.author}</span>
                  <span>•</span>
                  <span>{article.duration_mins} Menit baca</span>
                </div>
              </div>
              <ExternalLink className="size-5 text-secondary/40 group-hover:text-primary" />
            </div>
          </a>
        ))}
      </div>

      <div className={`rounded-2xl p-8 text-center relative overflow-hidden ${
        isCompleted ? "bg-green-50 border border-green-200" : "bg-primary/5 border border-primary/20"
      }`}>
        <div className="relative z-10">
          {isCompleted ? (
            <>
              <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-green-800 mb-2">Modul Selesai!</h3>
              <p className="text-green-700 font-medium mb-6">
                Skor Quiz Anda: {mod.quiz_score?.toFixed(0)}%
              </p>
              <Button onClick={() => router.push("/edu")} className="bg-green-600 hover:bg-green-700 text-white">
                Lanjut ke Modul Berikutnya
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-black text-secondary mb-2">Uji Pengetahuan Anda</h3>
              <p className="text-secondary-light font-medium mb-6 max-w-lg mx-auto">
                Setelah membaca semua materi, kerjakan quiz untuk menyelesaikan modul ini dan membuka modul berikutnya.
              </p>
              <Button 
                onClick={() => router.push(`/edu/${mod.id}/quiz`)}
                className="gap-2 px-8 py-6 text-lg"
              >
                <Play className="size-5" /> Mulai Quiz
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}