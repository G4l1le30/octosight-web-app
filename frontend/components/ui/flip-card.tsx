"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type FlipDirection = "horizontal" | "vertical";
type FlipTrigger = "hover" | "click";

interface FlipCardProps {
  children: [React.ReactNode, React.ReactNode];
  className?: string;
  cardClassName?: string;
  direction?: FlipDirection;
  trigger?: FlipTrigger;
  duration?: number;
  perspective?: number;
}

export function FlipCard({
  children,
  className,
  cardClassName,
  direction = "horizontal",
  trigger = "hover",
  duration = 0.6,
  perspective = 1000,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isHorizontal = direction === "horizontal";
  const rotateVar = isHorizontal ? "rotateY" : "rotateX";

  const handleMouseEnter = useCallback(() => {
    if (trigger === "hover") setIsFlipped(true);
  }, [trigger]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === "hover") setIsFlipped(false);
  }, [trigger]);

  const handleClick = useCallback(() => {
    if (trigger === "click") setIsFlipped((prev) => !prev);
  }, [trigger]);

  return (
    <div
      className={cn("relative cursor-pointer", className)}
      style={{ perspective: `${perspective}px` }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div
        className={cn("relative h-full w-full", cardClassName)}
        style={{
          transformStyle: "preserve-3d",
          transition: `transform ${duration}s ease`,
          transform: isFlipped ? `rotate${isHorizontal ? "Y" : "X"}(180deg)` : "none",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {children[0]}
        </div>

        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: isHorizontal ? "rotateY(180deg)" : "rotateX(180deg)",
          }}
        >
          {children[1]}
        </div>
      </div>
    </div>
  );
}

interface FlipCardFaceProps {
  children: React.ReactNode;
  className?: string;
}

export function FlipCardFront({ children, className }: FlipCardFaceProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden rounded-3xl", className)}>
      {children}
    </div>
  );
}

export function FlipCardBack({ children, className }: FlipCardFaceProps) {
  return (
    <div className={cn("h-full w-full overflow-hidden rounded-3xl", className)}>
      {children}
    </div>
  );
}
