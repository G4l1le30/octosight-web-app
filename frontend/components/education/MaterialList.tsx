import React from "react";
import { CheckCircle2, Lock, ExternalLink } from "lucide-react";
import { EducationArticle } from "@/types/education";

interface MaterialListProps {
  articles: EducationArticle[];
  isLocked: boolean;
  onArticleClick: (id: string, url: string) => void;
  completedArticles: number;
  totalArticles: number;
  isCompleted: boolean;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  articles,
  isLocked,
  onArticleClick,
  completedArticles,
  totalArticles,
  isCompleted
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-secondary">Learning Materials</h2>
        <div className="w-48">
          <p className="text-sm font-bold text-secondary mb-1">
            Progress: {completedArticles + (isCompleted ? 1 : 0)} / {totalArticles + 1} completed
          </p>
          <div className="w-full h-1.5 bg-neutral-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${((completedArticles + (isCompleted ? 1 : 0)) / (totalArticles + 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-12">
        {articles.map((article, idx) => {
          const content = (
            <div className={`flex items-start justify-between ${isLocked ? 'opacity-60' : ''}`}>
              <div className="flex gap-4">
                <div className={`mt-1 shrink-0 size-6 rounded-full flex items-center justify-center border-2 ${
                  article.is_read 
                    ? "bg-green-500 border-green-500 text-white shadow-sm" 
                    : "bg-white border-secondary text-secondary"
                }`}>
                  {article.is_read ? <CheckCircle2 className="size-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 ${isLocked ? 'text-secondary' : 'text-secondary group-hover:text-primary transition-colors'}`}>
                    {article.title}
                  </h3>
                  <p className="text-sm text-secondary-light font-medium mb-3 line-clamp-2">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-secondary/60">
                    <span>By: {article.author}</span>
                    <span>•</span>
                    <span>{article.duration_mins} Mins read</span>
                  </div>
                </div>
              </div>
              {isLocked ? (
                <Lock className="size-5 text-secondary/30 shrink-0" />
              ) : (
                <ExternalLink className="size-5 text-secondary/40 group-hover:text-primary shrink-0" />
              )}
            </div>
          );

          if (isLocked) {
            return (
              <div key={article.id} className="block bg-neutral-page border border-neutral-border rounded-xl p-6 cursor-not-allowed">
                {content}
              </div>
            );
          }

          return (
            <button
              key={article.id}
              onClick={() => onArticleClick(article.id, article.url)}
              className="w-full text-left block bg-white border border-neutral-border hover:border-primary hover:shadow-md rounded-xl p-6 transition-all group"
            >
              {content}
            </button>
          );
        })}
      </div>
    </>
  );
};
