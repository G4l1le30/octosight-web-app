import React from "react";
import { Trophy, Clock, BookOpen } from "lucide-react";
import { EducationModuleWithProgress } from "@/types/education";

interface ModuleHeaderProps {
  module: EducationModuleWithProgress;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ module }) => {
  const totalMinutes = module.articles.reduce((sum, a) => sum + (a.duration_mins || 0), 0);
  return (
    <div className="bg-white border border-neutral-border rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm mb-6 md:mb-8">
      <p className="text-secondary-light leading-relaxed font-medium mb-4 md:mb-6">
        {module.description}
      </p>
      <div className="flex flex-wrap gap-y-3 md:gap-y-4 gap-x-4 md:gap-x-6 items-center text-xs md:text-sm font-bold text-secondary">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Trophy className="size-4 text-primary" />
          <span>Level: <span className="capitalize">{module.level.toLowerCase()}</span></span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Clock className="size-4 text-primary" />
          <span>Estimation: {totalMinutes} Mins</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <BookOpen className="size-4 text-primary" />
          <span>{module.articles.length} Articles</span>
        </div>
      </div>
    </div>
  );
};
