"use client";

import { AlertTriangle } from "lucide-react";

export function ValidationBanner({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Missing {missing.length} required asset{missing.length !== 1 ? "s" : ""}
          </p>
          <ul className="mt-1 space-y-0.5">
            {missing.map((item) => (
              <li key={item} className="text-xs text-red-600 dark:text-red-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
