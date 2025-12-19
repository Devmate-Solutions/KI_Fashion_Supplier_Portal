"use client";

import { useState } from "react";
import clsx from "clsx";

export default function Tabs({ tabs, defaultTab = 0, activeTab, onTabChange, className = "" }) {
  const [internalCurrent, setInternalCurrent] = useState(defaultTab);
  const isControlled = activeTab !== undefined && onTabChange !== undefined;
  const current = isControlled ? activeTab : internalCurrent;
  const setCurrent = isControlled ? onTabChange : setInternalCurrent;

  return (
    <div className={className}>
      <div className="flex items-center gap-1 border-b border-app-border">
        {tabs.map((t, i) => {
          const selected = i === current;
          return (
            <button
              key={t.label}
              onClick={() => setCurrent(i)}
              className={clsx(
                "px-3 py-2 text-sm rounded-t-[4px] border-b-2 -mb-px transition",
                selected
                  ? "border-app-accent text-app-accent font-medium"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => {
        const hidden = i !== current;
        return (
          <div key={t.label} hidden={hidden} className="pt-4">
            {!hidden && t.content}
          </div>
        );
      })}
    </div>
  );
}

