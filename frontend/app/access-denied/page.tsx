"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

function AccessDeniedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const info = reason
    ? {
        title: "Access Denied",
        description:
          "You do not have permission to view this page. If you believe this is an error, please contact support.",
      }
    : null;

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-3 md:px-4 py-8 md:py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 md:mb-8">
          <div className="w-8 h-8 md:w-12 md:h-12 md:w-16 md:h-16 bg-risk-high/10 text-risk-high rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
            <ShieldOff className="size-8" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary mb-1.5 md:mb-2">
            {info?.title || "Access Denied"}
          </h1>
          <p className="text-secondary/60 text-xs md:text-sm leading-relaxed">
            {info?.description ||
              "You do not have permission to access this page."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
          <Button
            variant="outline"
            className="gap-1.5 md:gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" /> Go Back
          </Button>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <Loader2 className="animate-spin size-8 text-primary" />
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AccessDeniedContent />
    </Suspense>
  );
}
