"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { ContentLevels, CampaignConfig, ContentLevelEntry } from "@/lib/types";
import { toast } from "sonner";

export default function ContentPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [levels, setLevels] = useState<ContentLevels | null>(null);
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cl, cfg] = await Promise.all([
          api.getContentLevels(campaign),
          api.getConfig(campaign),
        ]);
        setLevels(cl);
        setConfig(cfg);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load content levels");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (!levels) return null;

  // Group all entries by text_type
  const allEntries: (ContentLevelEntry & { severity: "exhausted" | "low" })[] = [
    ...levels.exhausted.map((e) => ({ ...e, severity: "exhausted" as const })),
    ...levels.low.map((e) => ({ ...e, severity: "low" as const })),
  ];

  const byType = allEntries.reduce(
    (acc, entry) => {
      if (!acc[entry.text_type]) acc[entry.text_type] = [];
      acc[entry.text_type].push(entry);
      return acc;
    },
    {} as Record<string, typeof allEntries>
  );

  // Sort entries within each type by remaining ascending
  for (const entries of Object.values(byType)) {
    entries.sort((a, b) => a.remaining - b.remaining);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {levels.exhausted.length > 0 && (
          <Badge className="bg-red-500 text-white">
            {levels.exhausted.length} exhausted
          </Badge>
        )}
        {levels.low.length > 0 && (
          <Badge className="bg-yellow-500 text-white">
            {levels.low.length} low
          </Badge>
        )}
        {levels.total_issues === 0 && (
          <p className="text-sm text-green-700">All content levels healthy</p>
        )}
      </div>

      {config && (
        <p className="text-xs text-muted-foreground">
          Threshold: {levels.threshold} posts
        </p>
      )}

      {Object.entries(byType).map(([textType, entries]) => (
        <div key={textType} className="space-y-1">
          <h3 className="text-sm font-medium">{textType}</h3>
          {entries.map((entry, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                entry.severity === "exhausted"
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="truncate">
                <span className="font-medium">{entry.creator}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {entry.text_pack}
                </span>
              </div>
              <Badge
                className={
                  entry.remaining === 0
                    ? "bg-red-500 text-white"
                    : "bg-yellow-500 text-white"
                }
              >
                {entry.remaining}
              </Badge>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
