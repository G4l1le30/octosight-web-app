import React from "react";

interface DownloadModalProps {
  isOpen: boolean;
  downloadPassword: string;
  downloadError: string;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  downloadPassword,
  downloadError,
  onPasswordChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4 bg-secondary/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-sm w-full p-6 md:p-8 animate-in zoom-in-95 duration-200 border border-neutral-border">
        <div className="text-center mb-4 md:mb-6">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-risk-high/10 text-risk-high rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 md:h-7 w-5 md:w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-secondary">
            Secure Download
          </h3>
          <p className="text-secondary/60 text-xs md:text-sm mt-1.5 md:mt-2 font-normal leading-relaxed">
            You are about to download potentially malicious content. Please
            type <span className="font-bold text-secondary">confirm</span>{" "}
            to proceed.
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1 md:space-y-1.5">
            <label className="text-xs font-bold text-secondary opacity-80">
              Confirmation
            </label>
            <input
              type="text"
              className={`w-full p-3 bg-neutral-page border rounded-xl outline-none transition-all font-normal text-sm ${downloadError ? "border-risk-high focus:border-risk-high" : "border-neutral-border focus:border-primary"}`}
              placeholder="Type 'confirm'..."
              value={downloadPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              autoFocus
            />
            {downloadError && (
              <p className="text-xs font-bold text-risk-high mt-0.5 md:mt-1">
                {downloadError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:gap-2 pt-1.5 md:pt-2">
            <button
              onClick={onConfirm}
              className="w-full py-2 md:py-3 bg-risk-high text-white rounded-lg md:rounded-xl font-bold text-xs hover:bg-risk-high/90 transition-all shadow-lg shadow-risk-high/20"
            >
              Confirm Download
            </button>
            <button
              onClick={onCancel}
              className="w-full py-1.5 md:py-2 font-bold text-xs text-secondary/60 hover:text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
