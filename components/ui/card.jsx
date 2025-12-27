import clsx from "clsx";

export function Card({ className, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={clsx("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return <h2 className={clsx("text-xl font-bold tracking-tight text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={clsx("text-sm font-medium text-slate-700", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={clsx("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={clsx("flex items-center justify-end gap-3 border-t border-slate-50 p-6", className)} {...props} />;
}
