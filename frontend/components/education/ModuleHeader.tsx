import React from "react";
import { Trophy, Clock, BookOpen } from "lucide-react";
import { EducationModuleWithProgress } from "@/types/education";

interface ModuleHeaderProps {
  module: EducationModuleWithProgress;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ module }) => {
  return (
    <div className="bg-white border border-neutral-border rounded-2xl p-6 shadow-sm mb-8">
      <p className="text-secondary-light leading-relaxed font-medium mb-6">
        {module.description}
      </p>
      <div className="flex flex-wrap gap-y-4 gap-x-6 items-center text-sm font-bold text-secondary">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <span>Level: <span className="capitalize">{module.level.toLowerCase()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span>Estimation: {module.duration_mins} Mins</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <span>{module.articles.length} Articles</span>
        </div>
      </div>
    </div>
  );
};
