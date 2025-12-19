"use client";

import clsx from "clsx";

/**
 * ProgressBar Component
 * A reusable progress bar component that displays progress with percentage and labels.
 * 
 * @param {Object} props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {string} props.label - Main label text
 * @param {string} props.subLabel - Optional sub-label text
 * @param {string} props.variant - Variant: 'default' | 'success' | 'error'
 * @param {boolean} props.showPercentage - Whether to show percentage (default: true)
 * @param {string} props.className - Additional CSS classes
 */
export default function ProgressBar({
  progress = 0,
  label,
  subLabel,
  variant = "default",
  showPercentage = true,
  className,
}) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const roundedProgress = Math.round(clampedProgress);

  const variants = {
    default: "bg-blue-600",
    success: "bg-green-600",
    error: "bg-red-600",
  };

  return (
    <div className={clsx("w-full", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-slate-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-slate-600">{roundedProgress}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={clsx(
            "h-full transition-all duration-300 ease-out rounded-full",
            variants[variant] || variants.default
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {subLabel && (
        <p className="text-xs text-slate-500 mt-1">{subLabel}</p>
      )}
    </div>
  );
}

