"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AuthRequiredProps {
  title?: string;
  description?: string;
}

export function AuthRequired({ 
  title = "Login Required", 
  description = "Please log in to your account to access this feature and track your progress."
}: AuthRequiredProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in zoom-in duration-500">
      <div className="max-w-md w-full">
        <div className="card p-10 shadow-xl text-center border-neutral-border">
          {/* Icon Header */}
          <div className="mb-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-secondary">{title}</h1>
            <p className="text-secondary/60 text-sm mt-2 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              size="md" 
              className="w-full text-base" 
              onClick={() => window.location.href = "/login"}
            >
              Sign In to OctoSight
            </Button>
            <div className="pt-2 text-center">
              <p className="text-sm font-medium text-secondary/40">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-bold">
                  Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
