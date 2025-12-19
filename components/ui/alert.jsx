import clsx from "clsx";

const VARIANTS = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

export function Alert({ variant = "info", title, description, className }) {
  return (
    <div
      className={clsx(
        "rounded-lg border px-4 py-3 text-sm",
        VARIANTS[variant],
        className
      )}
    >
      {title && <p className="font-medium">{title}</p>}
      {description && <p>{description}</p>}
    </div>
  );
}
