"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EducationArticle } from "@/types/education";
import { useAuth } from "@/lib/auth-context";
import {
  Loader2,
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ChevronRight,
  User,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderBoldInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderContent(content?: any) {
  if (!content) return null;

  if (Array.isArray(content)) {
    return content.map((section, i) => (
      <div key={i} className="mb-8">
        {section.heading && (
          <h2 className="text-xl md:text-2xl font-bold mt-0 mb-3">
            {section.heading}
          </h2>
        )}
        {section.body && (
          <p className="text-base md:text-lg leading-relaxed mb-3 text-secondary text-justify">
            {renderBoldInline(section.body)}
          </p>
        )}
      </div>
    ));
  }

  const lines = content.split("\n");
  return lines.map((line: string, i: number) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      return (
        <h2 key={i} className="text-xl md:text-2xl font-bold mt-8 mb-3">
          {renderBoldInline(trimmed.replace("## ", ""))}
        </h2>
      );
    }
    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      return (
        <h3 key={i} className="text-lg font-bold mt-6 mb-2 text-primary">
          {renderBoldInline(trimmed.replace(/\*\*/g, ""))}
        </h3>
      );
    }
    if (/^\d+\.\s/.test(trimmed)) {
      return (
        <li
          key={i}
          className="ml-5 list-decimal text-base md:text-lg leading-relaxed mb-1.5 text-secondary"
        >
          {renderBoldInline(trimmed.replace(/^\d+\.\s*/, ""))}
        </li>
      );
    }
    if (trimmed.startsWith("- ")) {
      const c = trimmed.replace(/^-\s\*\*/, "").replace(/\*\*/, "");
      return (
        <li
          key={i}
          className="ml-5 list-disc text-base md:text-lg leading-relaxed mb-1.5 text-secondary"
        >
          {renderBoldInline(c)}
        </li>
      );
    }
    if (trimmed === "") return <div key={i} className="h-3" />;
    return (
      <p
        key={i}
        className="text-base md:text-lg leading-relaxed mb-3 text-secondary text-justify"
      >
        {renderBoldInline(trimmed)}
      </p>
    );
  });
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [article, setArticle] = useState<EducationArticle | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRead, setIsRead] = useState(false);
  const [readingTimeLeft, setReadingTimeLeft] = useState<number | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/v1/education/articles/${articleId}`);
        if (response.status === 403)
          throw new Error("Complete the previous article first");
        if (!response.ok) throw new Error("Article not found");
        const data = await response.json();
        setArticle(data);
        setModuleTitle(data.module_title || "");
        setModuleId(data.module_id || "");
        setRelatedArticles(data.related_articles || []);
        setIsRead(data.is_read || false);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  useEffect(() => {
    if (!user || !article || isRead) return;

    const savedEndTime = localStorage.getItem(`octo_read_${articleId}_end`);
    if (savedEndTime) {
      const remaining = Math.max(
        0,
        Math.ceil((parseInt(savedEndTime) - Date.now()) / 1000),
      );
      if (remaining > 0) setReadingTimeLeft(remaining);
    }

    if (!savedEndTime) {
      const endTime = Date.now() + 30000;
      localStorage.setItem(`octo_read_${articleId}_end`, endTime.toString());
      setReadingTimeLeft(30);
    }

    const interval = setInterval(() => {
      const end = parseInt(
        localStorage.getItem(`octo_read_${articleId}_end`) || "0",
        10,
      );
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
        setReadingTimeLeft(0);
        localStorage.removeItem(`octo_read_${articleId}_end`);

        if (!isRead) {
          setMarking(true);
          fetch(`/api/v1/education/articles/${articleId}/read`, {
            method: "POST",
          })
            .then(() => {
              setIsRead(true);
              toast.success("Marked as read");
            })
            .catch(() => {})
            .finally(() => setMarking(false));
        }
      } else {
        setReadingTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, article, articleId, isRead]);

  if (authLoading || loading)
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <Loader2 className="animate-spin size-12 text-primary mx-auto mb-4" />
        <p className="text-secondary font-semibold text-lg">
          Loading article...
        </p>
      </div>
    );

  if (!article)
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-xl">
        <div className="bg-risk-high/10 text-risk-high p-8 rounded-2xl border border-risk-high/20 mb-6">
          <BookOpen className="size-14 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Article Not Found
          </h2>
          <p className="text-base font-medium opacity-80">
            The article you are looking for could not be found.
          </p>
        </div>
        <Button
          onClick={() => router.push("/edu")}
          variant="outline"
          className="gap-2 text-base"
        >
          <ArrowLeft className="size-4" /> Back to Learning Hub
        </Button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm md:text-base font-semibold text-secondary-light mb-8">
        <button
          onClick={() => router.push("/edu")}
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <span className="hidden sm:inline">Learning Hub</span>
        </button>
        <ChevronRight className="size-4" />
        <button
          onClick={() => router.push(moduleId ? `/edu/${moduleId}` : "/edu")}
          className="hover:text-primary transition-colors"
        >
          {moduleTitle || "Module"}
        </button>
        <ChevronRight className="size-4 text-secondary-light/50" />
        <span className="text-primary truncate max-w-[200px] md:max-w-xs">
          {article.title}
        </span>
      </nav>

      {/* Header — title, author, date, description (image comes after) */}
      <header className="mb-8 max-w-6xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-5">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base text-secondary-light mb-5">
          <span className="flex items-center gap-1.5 font-medium">
            <User className="size-4" /> {article.author}
          </span>
          {article.publication_date && (
            <span className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="size-4" />{" "}
              {formatDate(article.publication_date)}
            </span>
          )}
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="size-4" /> {article.duration_mins} min read
          </span>
          {readingTimeLeft !== null && readingTimeLeft > 0 && (
            <span className="text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              Reading... {readingTimeLeft}s
            </span>
          )}
          {isRead && (
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
              <CheckCircle2 className="size-4" /> Read
            </span>
          )}
        </div>
      </header>

      {/* Hero Image — after headline */}
      {article.image_url && (
        <div className="rounded-2xl overflow-hidden mb-10 bg-neutral-page shadow-sm max-w-6xl relative h-64 md:h-80 lg:h-96">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
        </div>
      )}

      {/* Description */}
      {article.description && (
        <p className="text-base md:text-lg text-secondary-light leading-relaxed mb-8 pb-8 border-b border-neutral-border italic max-w-6xl text-justify">
          {article.description}
        </p>
      )}

      {/* Article Content */}
      <article className="max-w-6xl">
        {article.content ? (
          renderContent(article.content)
        ) : (
          <p className="text-secondary-light text-lg">
            Full content is not available for this article.
          </p>
        )}
      </article>

      {(article.url || (user && !isRead)) && (
        <div className="mt-12 rounded-2xl p-6 md:p-8 text-center bg-neutral-page border border-neutral-border max-w-6xl">
          {article.url && (
            <div className={user && !isRead ? "mb-5 pb-5 border-b border-neutral-border/60" : ""}>
              <p className="text-base text-secondary-light mb-3">
                Read the full article on the original source:
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:underline"
              >
                View Original Article
              </a>
            </div>
          )}
          {user && !isRead && (
            <div>
              <Button
                onClick={() => {
                  if (marking) return;
                  setMarking(true);
                  fetch(`/api/v1/education/articles/${articleId}/read`, {
                    method: "POST",
                  })
                    .then(() => {
                      setIsRead(true);
                      localStorage.removeItem(`octo_read_${articleId}_end`);
                      setReadingTimeLeft(null);
                      toast.success("Marked as read");
                    })
                    .catch(() => toast.error("Failed to mark as read"))
                    .finally(() => setMarking(false));
                }}
                disabled={marking}
                className="gap-2 text-base px-6 py-3"
              >
                <CheckCircle2 className="size-5" />
                {marking ? "Marking..." : "Mark as Read"}
              </Button>
              <p className="text-sm text-secondary-light mt-2">
                or wait 30 seconds for auto-mark
              </p>
            </div>
          )}
        </div>
      )}

      {/* Next article or quiz */}
      <section className="mt-10 pt-8 border-t border-neutral-border max-w-6xl">
        {article.next_article ? (
          <button
            onClick={() => router.push(`/article/${article.next_article!.id}`)}
            className="w-full flex items-center justify-between p-5 rounded-xl border border-neutral-border hover:border-primary/30 hover:bg-neutral-page/50 transition-all group"
          >
            <div className="text-left">
              <span className="text-sm font-medium text-primary mb-1 block">
                Next Article
              </span>
              <span className="text-base font-semibold text-secondary group-hover:text-primary transition-colors">
                {article.next_article.title}
              </span>
              <span className="text-sm text-secondary-light ml-2">
                {article.next_article.duration_mins} min
              </span>
            </div>
            <ChevronRight className="size-6 text-secondary-light group-hover:text-primary shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => router.push(`/edu/${article.module_id}`)}
            className="w-full flex items-center justify-between p-5 rounded-xl border border-neutral-border hover:border-primary/30 hover:bg-neutral-page/50 transition-all group"
          >
            <div className="text-left">
              <span className="text-sm font-medium text-primary mb-1 block">
                Complete Module
              </span>
              <span className="text-base font-semibold text-secondary group-hover:text-primary transition-colors flex items-center gap-2">
                <GraduationCap className="size-5" />
                Take Quiz to Complete Module
              </span>
            </div>
            <ChevronRight className="size-6 text-secondary-light group-hover:text-primary shrink-0" />
          </button>
        )}
      </section>
    </div>
  );
}
