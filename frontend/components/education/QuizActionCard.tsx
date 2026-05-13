import React from "react";
import { CheckCircle2, Lock, Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuizActionCardProps {
  moduleId: string;
  isCompleted: boolean;
  isLocked: boolean;
  allMaterialsFinished: boolean;
  quizScore?: number;
  savedQuiz: any;
  hasAttempted: boolean;
  onStartQuiz: () => void;
  onResetQuiz?: () => void;
  onNextModule?: () => void;
}

export const QuizActionCard: React.FC<QuizActionCardProps> = ({
  isCompleted,
  isLocked,
  allMaterialsFinished,
  quizScore,
  savedQuiz,
  hasAttempted,
  onStartQuiz,
  onResetQuiz,
  onNextModule
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`rounded-2xl p-8 text-center relative overflow-hidden ${
      isCompleted ? "bg-green-50 border border-green-200" : (isLocked || !allMaterialsFinished) ? "bg-neutral-page border border-neutral-border" : "bg-primary/5 border border-primary/20"
    }`}>
      <div className="relative z-10">
        {isCompleted ? (
          <>
            <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-800 mb-2">Module Completed!</h3>
            <p className="text-green-700 font-medium mb-6">
              Your Best Score: {Math.round((quizScore || 0) / 10)} / 10
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={onStartQuiz}
                className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-5 text-lg"
              >
                <Play className="size-5" /> Retake Quiz
              </Button>

              {onNextModule && (
                <Button 
                  onClick={onNextModule}
                  variant="outline"
                  className="bg-white border-neutral-border text-secondary hover:border-green-500 gap-2 px-8 py-5 text-lg shadow-sm transition-colors"
                >
                  Next Module <ArrowRight className="size-5" />
                </Button>
              )}
            </div>
          </>
        ) : isLocked ? (
          <>
            <h3 className="text-2xl font-bold text-secondary mb-2">Module Locked</h3>
            <p className="text-secondary-light font-medium mb-6 max-w-lg mx-auto">
              Please complete the previous modules to unlock this quiz and its learning materials.
            </p>
            <Button disabled className="gap-2 px-8 py-6 text-lg bg-neutral-border text-secondary/40 border-none pointer-events-none shadow-none">
              <Lock className="size-5" /> Quiz Locked
            </Button>
          </>
        ) : !allMaterialsFinished ? (
          <>
            <h3 className="text-2xl font-bold text-secondary mb-2">Quiz Locked</h3>
            <p className="text-secondary-light font-medium mb-6 max-w-lg mx-auto">
              Please read all learning materials above before taking the quiz to test your knowledge.
            </p>
            <Button disabled className="gap-2 px-8 py-6 text-lg bg-neutral-border text-secondary/40 border-none pointer-events-none shadow-none">
              <Lock className="size-5" /> Finish Materials First
            </Button>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-secondary mb-2">Test Your Knowledge</h3>
            <p className="text-secondary-light font-medium mb-6 max-w-lg mx-auto">
              {savedQuiz 
                ? "You have a quiz in progress. Continue to finish your evaluation." 
                : hasAttempted
                  ? "You haven't passed the evaluation yet. Try again to complete the module."
                  : "Great! You've finished all materials. Take the quiz now to complete this module."}
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={onStartQuiz}
                  className="gap-2 px-10 py-7 text-xl shadow-lg shadow-primary/20"
                >
                  <Play className="size-5" /> {savedQuiz ? "Continue Quiz" : hasAttempted ? "Retake Quiz" : "Start Quiz"}
                </Button>

                {savedQuiz && onResetQuiz && (
                  <Button 
                    onClick={onResetQuiz}
                    variant="outline"
                    className="gap-2 px-8 py-7 text-lg border-risk-high/30 text-risk-high hover:bg-risk-high/5"
                  >
                    Start Fresh
                  </Button>
                )}
              </div>
              
              {savedQuiz && (
                <div className="flex gap-4 text-md font-medium text-secondary mt-2">
                  <span>{savedQuiz.answeredCount} answered</span>
                  <span>•</span>
                  <span className={savedQuiz.timeLeft < 60 ? "text-risk-high animate-pulse" : ""}>
                    {formatTime(savedQuiz.timeLeft)} left
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
