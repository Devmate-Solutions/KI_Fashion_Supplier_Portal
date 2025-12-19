import clsx from "clsx";

const baseStyles = "flex min-h-[120px] w-full rounded-md border border-app-border bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function Textarea({ className, ...props }) {
  return <textarea className={clsx(baseStyles, className)} {...props} />;
}
