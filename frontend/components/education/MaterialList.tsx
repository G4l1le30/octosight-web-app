import React from "react";
import Image from "next/image";
import { CheckCircle2, Lock, ChevronRight } from "lucide-react";
import { EducationArticle } from "@/types/education";

interface MaterialListProps {
  articles: EducationArticle[];
  isLocked: boolean;
  onArticleClick: (id: string) => void;
  completedArticles: number;
  totalArticles: number;
  isCompleted: boolean;
  readingArticleId?: string | null;
  readingTimeLeft?: number;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  articles,
  isLocked,
  onArticleClick,
  completedArticles,
  totalArticles,
  isCompleted,
  readingArticleId,
  readingTimeLeft,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-secondary">
          Learning Materials
        </h2>
        <div className="w-36 md:w-48">
          <p className="text-xs md:text-sm font-bold text-secondary mb-0.5 md:mb-1">
            Progress: {completedArticles + (isCompleted ? 1 : 0)} /{" "}
            {totalArticles + 1} completed
          </p>
          <div className="w-full h-1 md:h-1.5 bg-neutral-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${((completedArticles + (isCompleted ? 1 : 0)) / (totalArticles + 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4 mb-8 md:mb-12">
        {articles.map((article, idx) => {
          // Article is locked if the module is locked, OR if it's not the first article and the previous one isn't read yet
          const isArticleLocked =
            isLocked || (idx > 0 && !articles[idx - 1].is_read);
          const isReadingThis = readingArticleId === article.id;

          const content = (
            <div
              className={`flex items-start gap-3 md:gap-4 ${isArticleLocked ? "opacity-60" : ""}`}
            >
              {article.image_url && (
                <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg md:rounded-xl overflow-hidden bg-neutral-page relative">
                  <Image
                    src={article.image_url}
                    alt={article.title}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div
                className={`flex items-start justify-between flex-1 min-w-0 ${article.image_url ? "" : "ml-0"}`}
              >
                <div className="flex gap-3 md:gap-4">
                  <div
                    className={`mt-1 shrink-0 size-6 rounded-full flex items-center justify-center border-2 ${
                      article.is_read
                        ? "bg-green-500 border-green-500 text-white shadow-sm"
                        : "bg-white border-secondary text-secondary"
                    }`}
                  >
                    {article.is_read ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className={`text-base md:text-lg font-bold mb-1 truncate ${isArticleLocked ? "text-secondary" : "text-secondary group-hover:text-primary transition-colors"}`}
                    >
                      {article.title}
                    </h3>
                    <p className="text-xs md:text-sm text-secondary-light font-medium mb-2 md:mb-3 line-clamp-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 md:gap-4 text-xs font-bold text-secondary/60">
                      <span>By: {article.author}</span>
                      <span>•</span>
                      <span>{article.duration_mins} Mins read</span>
                      {isReadingThis &&
                        readingTimeLeft !== undefined &&
                        readingTimeLeft > 0 && (
                          <span className="text-primary bg-primary/10 px-1.5 md:px-2 py-0.5 rounded animate-pulse">
                            Reading... {readingTimeLeft}s
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                {isArticleLocked ? (
                  <Lock className="size-5 text-secondary/60 shrink-0 mt-0.5 md:mt-1" />
                ) : (
                  <ChevronRight className="size-5 text-secondary/40 group-hover:text-primary transition-colors shrink-0 mt-0.5 md:mt-1" />
                )}
              </div>
            </div>
          );

          if (isArticleLocked) {
            return (
              <div
                key={article.id}
                className="block bg-neutral-page border border-neutral-border rounded-lg md:rounded-xl p-4 md:p-6 cursor-not-allowed"
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={article.id}
              onClick={() => onArticleClick(article.id)}
              className={`w-full text-left block bg-white border ${isReadingThis ? "border-primary ring-1 ring-primary/20" : "border-neutral-border hover:border-primary hover:shadow-md"} rounded-xl p-4 md:p-6 transition-all group`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
};
