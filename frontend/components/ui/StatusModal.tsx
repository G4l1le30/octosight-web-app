import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
  buttonText?: string;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  buttonText = "Done"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-neutral-border animate-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6",
            type === "success" ? "bg-green-100 text-green-600" : "bg-risk-high/10 text-risk-high"
          )}>
            {type === "success" ? <CheckCircle className="size-8" /> : <AlertCircle className="size-8" />}
          </div>
          
          <h3 className="text-xl font-bold text-secondary mb-2">{title}</h3>
          <p className="text-secondary/60 text-sm font-medium leading-relaxed mb-8">
            {message}
          </p>

          <button
            onClick={onClose}
            className={cn(
              "w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
              type === "success" 
                ? "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20" 
                : "bg-risk-high text-white hover:bg-risk-high/90 shadow-risk-high/20"
            )}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
