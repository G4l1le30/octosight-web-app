import React from "react";

interface QuizQuestionCardProps {
  question: string;
  options: string[];
  selectedAnswer: number;
  onSelectOption: (index: number) => void;
}

export const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({ 
  question, 
  options, 
  selectedAnswer, 
  onSelectOption 
}) => {
  return (
    <div className="bg-white border border-neutral-border rounded-2xl p-8 shadow-sm">
      <h3 className="text-xl font-bold text-secondary mb-6 leading-relaxed">
        {question}
      </h3>
      
      <div className="space-y-4">
        {options.map((opt, oIdx) => (
          <button
            key={oIdx}
            onClick={() => onSelectOption(oIdx)}
            className={`w-full text-left px-6 py-5 rounded-2xl border-2 transition-all font-medium text-base ${
              selectedAnswer === oIdx 
                ? "border-primary bg-primary/5 text-primary shadow-sm" 
                : "border-neutral-border hover:bg-neutral-page text-secondary group"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <span className={`shrink-0 size-8 flex items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                  selectedAnswer === oIdx 
                    ? "bg-primary text-white shadow-sm" 
                    : "bg-neutral-page text-secondary-light border border-neutral-border group-hover:bg-white"
                }`}>
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="font-medium">{opt}</span>
              </div>
              <div className={`shrink-0 size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedAnswer === oIdx ? "border-primary bg-primary" : "border-neutral-border bg-white"
              }`}>
                {selectedAnswer === oIdx && <div className="size-2 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
