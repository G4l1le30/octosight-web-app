import React, { useState } from "react";
import { DashboardStats } from "@/types/ticket";

interface SecurityFlagAnalysisProps {
  flagDist: DashboardStats["flagDist"];
}

export const SecurityFlagAnalysis: React.FC<SecurityFlagAnalysisProps> = ({ flagDist }) => {
  const [flagsExpanded, setFlagsExpanded] = useState(false);

  return (
    <div className="card p-8">
      <h3 className="font-bold mb-6 text-xl text-secondary">
        Security Flag Analysis (Sub-Categories)
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {flagDist.length > 0 ? (
          (flagsExpanded ? flagDist : flagDist.slice(0, 12)).map((item, idx) => (
            <div
              key={idx}
              className="bg-neutral-page border border-neutral-border p-4 rounded-xl flex flex-col items-center text-center group hover:border-primary transition-all h-full"
            >
              <span className="text-sm font-bold text-secondary mb-3 group-hover:text-primary transition-colors">
                {item.name}
              </span>
              <span className="text-2xl font-bold text-secondary mt-auto">
                {item.value}
              </span>
            </div>
          ))
        ) : (
          <p className="col-span-full py-10 text-center opacity-40 font-bold">
            No detection flags triggered yet.
          </p>
        )}
      </div>
      
      {flagDist.length > 12 && (
        <div className="mt-6 flex justify-center border-t border-neutral-border pt-4">
          <button 
            onClick={() => setFlagsExpanded(!flagsExpanded)}
            className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/5 px-6 py-2 rounded-lg transition-all"
          >
            {flagsExpanded ? (
              <>
                <span>View Less</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </>
            ) : (
              <>
                <span>View More</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
