import React from "react";
import { QuizAttempt } from "@/types/education";

interface QuizHistoryProps {
  history: QuizAttempt[];
  onViewAttempt: (id: number) => void;
}

export const QuizHistory: React.FC<QuizHistoryProps> = ({ history, onViewAttempt }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-12 bg-white border border-neutral-border rounded-2xl overflow-hidden">
      <div className="bg-neutral-page px-6 py-4 border-b border-neutral-border">
        <h3 className="font-bold text-secondary">Quiz History Summary</h3>
      </div>
      <div className="divide-y divide-neutral-border">
        {history.map((attempt) => (
          <div key={attempt.id} className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="font-bold text-secondary">
                Attempt #{attempt.attempt_number}
              </div>
              <div className={`px-2 py-1 rounded-md font-bold ${attempt.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {Math.round(attempt.score / 10)} / 10
              </div>
              <div className="font-medium text-secondary/80">
                {new Date(attempt.created_at + (attempt.created_at.includes('Z') ? '' : 'Z')).toLocaleString('en-GB', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }).replace(',', '')}
              </div>
            </div>
            <button 
              onClick={() => onViewAttempt(attempt.id)}
              className="text-sm font-bold text-primary hover:underline"
            >
              View Detail
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
