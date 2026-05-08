"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EducationModuleWithProgress } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Lock, CheckCircle2, PlayCircle, BookOpen } from "lucide-react";
import { AuthRequired } from "@/components/auth/AuthRequired";

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

  const completedCount = modules.filter((m) => m.status === "COMPLETED").length;
  const totalCount = modules.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-black mb-4">Security Microlearning</h1>
          <p className="text-secondary-light">
            Tingkatkan literasi digital Anda dengan modul keamanan berukuran kecil
            yang dirancang untuk mencegah penipuan.
          </p>
        </div>
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-secondary">Progres Belajar</p>
            <p className="text-xl font-black text-primary">
              {completedCount} / {totalCount} Modul
            </p>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center text-lg font-black text-primary relative overflow-hidden bg-white">
            <div 
              className="absolute bottom-0 left-0 right-0 bg-primary/20" 
              style={{ height: `${progressPercent}%` }}
            />
            <span className="relative z-10">{progressPercent}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 h-64 animate-pulse flex items-center justify-center">
              <Loader2 className="size-8 text-neutral-border animate-spin" />
            </div>
          ))
        ) : modules.map((mod) => {
          const isLocked = mod.status === "LOCKED";
          const isCompleted = mod.status === "COMPLETED";

          return (
            <div 
              key={mod.id} 
              onClick={() => !isLocked && router.push(`/edu/${mod.id}`)}
              className={`card group transition-all relative overflow-hidden ${
                isLocked ? "opacity-60 cursor-not-allowed bg-neutral-page" : "cursor-pointer hover:border-primary hover:shadow-md"
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    isLocked ? "bg-neutral-border/50 text-secondary" :
                    isCompleted ? "bg-green-100 text-green-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {mod.level}
                  </span>
                  {isLocked ? (
                    <Lock className="size-5 text-secondary/40" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <PlayCircle className="size-5 text-primary" />
                  )}
                </div>
                
                <h3 className="font-bold mb-2 leading-tight min-h-[48px]">{mod.title}</h3>
                
                <div className="flex items-center text-xs font-bold text-secondary/60 mb-4 gap-1">
                  <BookOpen className="size-3" />
                  <span>{mod.duration_mins} Menit</span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-bold mt-4 pt-4 border-t border-neutral-border/50">
                  {isCompleted && mod.quiz_score !== undefined ? (
                    <span className="text-green-600">Skor: {mod.quiz_score.toFixed(0)}%</span>
                  ) : isLocked ? (
                    <span className="text-secondary/50">Terkunci</span>
                  ) : (
                    <span className="text-primary group-hover:underline">Mulai Modul →</span>
                  )}
                </div>
              </div>
              
              {/* Progress bar di bagian bawah card */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-border">
                <div 
                  className={`h-full ${isCompleted ? "bg-green-500" : isLocked ? "bg-transparent" : "bg-blue-500 w-1/3"}`} 
                  style={isCompleted ? { width: "100%" } : {}}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
