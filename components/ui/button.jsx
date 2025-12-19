import clsx from "clsx";
import { cloneElement, forwardRef, isValidElement } from "react";

const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const variants = {
  primary: "bg-app-accent text-app-accent-foreground hover:bg-app-accent/90 shadow-sm shadow-app-accent/20 focus-visible:ring-app-accent",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-300",
  outline: "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300",
  subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300",
  ghost: "text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-300",
  destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20 focus-visible:ring-red-500",
};

const sizes = {
  icon: "h-9 w-9 p-0",
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
  xl: "h-14 px-10 text-lg",
};

export const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const styles = clsx(baseStyles, variants[variant], sizes[size], className);

    if (asChild && isValidElement(children)) {
      return cloneElement(children, {
        className: clsx(styles, children.props.className),
        ref,
        ...props,
      });
    }

    return (
      <button ref={ref} type={type} className={styles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
