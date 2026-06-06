"use client";

import Image from "next/image";

interface AuthShellProps {
  children: React.ReactNode;
  sideImage: string;
  sideImageAlt: string;
}

export function AuthShell({ children, sideImage, sideImageAlt }: AuthShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-neutral-page">
      <div className="relative hidden lg:block h-full w-full min-h-screen">
        <Image
          src={sideImage}
          alt={sideImageAlt}
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex flex-col justify-center min-h-screen">
        {children}
      </div>
    </div>
  );
}
