import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuizControlsProps {
  currentStep: number;
  totalQuestions: number;
  isLastStep: boolean;
  selectedAnswer: number;
  answers: number[];
  submitting: boolean;
  canSubmit: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const QuizControls: React.FC<QuizControlsProps> = ({
  currentStep,
  totalQuestions,
  isLastStep,
  selectedAnswer,
  answers,
  submitting,
  canSubmit,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="px-8 py-6 rounded-2xl font-bold"
        >
          Previous
        </Button>
        
        {isLastStep ? (
          <Button 
            onClick={onSubmit} 
            disabled={!canSubmit || submitting}
            className="px-10 py-6 rounded-2xl font-bold text-lg gap-2"
          >
            {submitting && <Loader2 className="size-5 animate-spin" />}
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button 
            onClick={onNext}
            disabled={selectedAnswer === -1}
            className="px-10 py-6 rounded-2xl font-bold text-lg"
          >
            Next Question
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 justify-center py-4">
        {new Array(totalQuestions).fill(0).map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep ? "w-8 bg-primary" : answers[i] !== -1 ? "w-4 bg-primary/40" : "w-4 bg-neutral-border"
            }`}
          />
        ))}
      </div>
    </>
  );
};
