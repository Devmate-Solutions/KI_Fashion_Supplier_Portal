import clsx from "clsx";

const baseStyles = "flex h-11 w-full rounded-md border border-app-border bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx(baseStyles, className)} {...props}>
      {children}
    </select>
  );
}
