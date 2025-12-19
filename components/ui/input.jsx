import { forwardRef } from "react";
import clsx from "clsx";

const baseStyles = "flex h-11 w-full rounded-md border border-app-border bg-white px-3 text-sm text-slate-900 ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={clsx(baseStyles, className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
