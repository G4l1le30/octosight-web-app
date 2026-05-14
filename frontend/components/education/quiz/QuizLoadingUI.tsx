import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, Brain, CheckCircle2 } from "lucide-react";

const loadingSteps = [
  { text: "Waking up AI Engine...", icon: Sparkles },
  { text: "Reviewing module material...", icon: BookOpen },
  { text: "Crafting dynamic questions...", icon: Brain },
  { text: "Finalizing quiz answers...", icon: CheckCircle2 }
];

export const QuizLoadingUI: React.FC = () => {
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingStepIndex(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = loadingSteps[loadingStepIndex].icon;
  const progressPercentage = ((loadingStepIndex + 1) / loadingSteps.length) * 100;
  
  return (
    <div className="container mx-auto px-4 min-h-[calc(100vh-120px)] flex flex-col items-center justify-center max-w-md">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-border w-full text-center">
        <div className="relative size-20 mx-auto mb-6 flex items-center justify-center bg-primary/10 rounded-full">
          <CurrentIcon className="size-10 text-primary animate-pulse" />
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full border-t-primary animate-spin" />
        </div>
        
        <h2 className="text-xl font-bold text-secondary mb-2">Generating Quiz</h2>
        
        <div className="h-2 w-full bg-neutral-border rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-primary transition-all duration-1000 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <p className="text-sm font-bold text-secondary-light animate-pulse">
          {loadingSteps[loadingStepIndex].text}
        </p>
      </div>
    </div>
  );
};
