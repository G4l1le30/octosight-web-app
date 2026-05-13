import React from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { QuizAttempt } from "@/types/education";
import { Button } from "@/components/ui/Button";

interface HistoryDetailModalProps {
  attempt: QuizAttempt | null;
  onClose: () => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ attempt, onClose }) => {
  if (!attempt) return null;

  const results = JSON.parse(attempt.details);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-neutral-border shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-border flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-secondary">Attempt #{attempt.attempt_number} Detail</h3>
            <p className="text-sm font-medium text-secondary/60">
              Score: {(attempt.score / 10).toFixed(1)} / 10.0 • {attempt.passed ? "Passed" : "Failed"}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-page rounded-xl transition-colors"
          >
            <X className="size-6 text-secondary/40" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {results.map((res: any, idx: number) => (
            <div key={idx} className={`p-5 rounded-2xl border-2 ${res.is_correct ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="font-bold text-secondary text-lg">
                  <span className={`mr-2 ${res.is_correct ? "text-green-600" : "text-red-600"}`}>
                    {idx + 1}.
                  </span>
                  {res.question}
                </div>
                {res.is_correct ? (
                  <CheckCircle2 className="size-6 text-green-500 shrink-0 mt-1" />
                ) : (
                  <XCircle className="size-6 text-red-500 shrink-0 mt-1" />
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <div className={`text-sm font-bold px-4 py-3 rounded-xl border-2 ${
                  res.is_correct 
                    ? "bg-green-100 border-green-200 text-green-800" 
                    : "bg-red-100 border-red-200 text-red-800"
                }`}>
                  Your Answer: {res.selected_answer_text || `Option ${res.selected_answer_index + 1}`}
                </div>
                {!res.is_correct && (
                  <p className="text-xs font-bold text-red-600/60 px-1 mt-2 italic">
                    Note: Correct answer and explanation are hidden for security. Please review the learning materials.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-neutral-page border-t border-neutral-border text-center">
          <Button onClick={onClose} className="w-full py-6 text-lg font-bold">
            Close History
          </Button>
        </div>
      </div>
    </div>
  );
};
