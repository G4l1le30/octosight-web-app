"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-secondary group-[.toaster]:border-neutral-border group-[.toaster]:shadow-lg font-sans border p-3 md:p-4 rounded-xl items-center gap-2 md:gap-3",
          title: "text-sm font-bold",
          description: "group-[.toast]:text-secondary/70 text-xs font-medium",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white font-bold rounded-lg px-3 py-2",
          cancelButton:
            "group-[.toast]:bg-neutral-page group-[.toast]:text-secondary font-bold rounded-lg px-3 py-2",
          error:
            "group-[.toaster]:border-risk-high group-[.toaster]:text-risk-high [&_svg]:text-risk-high",
          success:
            "group-[.toaster]:border-risk-low group-[.toaster]:text-risk-low [&_svg]:text-risk-low",
          warning:
            "group-[.toaster]:border-risk-medium group-[.toaster]:text-risk-medium [&_svg]:text-risk-medium",
          info:
            "group-[.toaster]:border-primary group-[.toaster]:text-primary [&_svg]:text-primary",
          default: 
            "group-[.toaster]:border-neutral-border group-[.toaster]:text-secondary [&_svg]:text-secondary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
