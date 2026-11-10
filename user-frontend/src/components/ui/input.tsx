import * as React from "react";

import { cn } from "@/lib/utils";

// Oversized input for low-literacy users on touch devices: min 56px tall,
// large text, thick high-contrast border, wide numeric-friendly padding.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-14 w-full min-w-0 rounded-xl border-2 border-slate-300 bg-white px-4 text-xl font-medium text-slate-900 shadow-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus-visible:border-orange-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-600/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-600",
        className
      )}
      {...props}
    />
  );
}

export { Input };
