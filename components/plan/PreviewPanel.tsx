"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PlanPreview } from "@/lib/types";
import { ChevronDown, ChevronUp } from "lucide-react";

const colorPalette = [
  "bg-blue-50 border-blue-200",
  "bg-purple-50 border-purple-200",
  "bg-teal-50 border-teal-200",
  "bg-orange-50 border-orange-200",
  "bg-pink-50 border-pink-200",
  "bg-indigo-50 border-indigo-200",
];

export function PreviewPanel({
  preview,
  loading,
}: {
  preview: PlanPreview | null;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Derive group colors per render based on current preview groups
  const groupColorMap = useMemo(() => {
    if (!preview) return {};
    const map: Record<string, string> = {};
    let idx = 0;
    for (const name of Object.keys(preview.groups)) {
      if (name !== "rest" && name !== "paused") {
        map[name] = colorPalette[idx % colorPalette.length];
        idx++;
      }
    }
    return map;
  }, [preview]);

  if (loading) {
    return (
      <div className="rounded-lg border p-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-48" />
      </div>
    );
  }

  if (!preview) return null;

  const activeGroups = Object.entries(preview.groups).filter(
    ([name]) => name !== "rest" && name !== "paused"
  );
  const restGroup = preview.groups["rest"] || [];
  const pausedGroup = preview.groups["paused"] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Preview — {preview.date}</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground min-h-[44px] px-2"
        >
          {expanded ? (
            <>
              Collapse <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Expand <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>

      <div className="flex gap-3 text-sm">
        <span className="text-green-700 font-medium">
          {preview.posting} posting
        </span>
        <span className="text-muted-foreground">
          {preview.resting} resting
        </span>
        <span className="text-muted-foreground">
          {preview.paused} paused
        </span>
      </div>

      {expanded && (
        <div className="space-y-3">
          {activeGroups.map(([name, creators]) => (
            <div
              key={name}
              className={`rounded-lg border p-2 ${groupColorMap[name] || colorPalette[0]}`}
            >
              <div className="text-xs font-medium mb-1">
                {name}{" "}
                <Badge variant="outline" className="text-xs ml-1">
                  {creators.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {creators.map((c) => (
                  <span key={c.creator} className="text-xs px-1.5 py-0.5 bg-white/60 rounded">
                    {c.creator}
                    <span className="text-muted-foreground ml-1">{c.region}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}

          {restGroup.length > 0 && (
            <div className="rounded-lg border p-2 bg-gray-50 border-gray-200">
              <div className="text-xs font-medium mb-1">
                Rest <Badge variant="outline" className="text-xs ml-1">{restGroup.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {restGroup.map((c) => (
                  <span key={c.creator} className="text-xs text-muted-foreground px-1.5 py-0.5">
                    {c.creator}
                  </span>
                ))}
              </div>
            </div>
          )}

          {pausedGroup.length > 0 && (
            <div className="rounded-lg border p-2 bg-red-50 border-red-200">
              <div className="text-xs font-medium mb-1">
                Paused <Badge variant="outline" className="text-xs ml-1">{pausedGroup.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {pausedGroup.map((c) => (
                  <span key={c.creator} className="text-xs text-muted-foreground px-1.5 py-0.5">
                    {c.creator}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
