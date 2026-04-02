"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { PlanNewShortfall } from "@/lib/types";
import { toast } from "sonner";

export default function ContentPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [shortfalls, setShortfalls] = useState<PlanNewShortfall[]>([]);
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPlansNewQueueCheck(campaign, "active");
        setShortfalls(data.shortfalls);
        setDate(data.date);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load queue check");
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

  // Group shortfalls by content_type
  const byType = shortfalls.reduce(
    (acc, entry) => {
      const key = `${entry.content_category}/${entry.content_type}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {} as Record<string, PlanNewShortfall[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {shortfalls.length > 0 ? (
          <Badge className="bg-red-500 text-white">
            {shortfalls.length} shortfall{shortfalls.length !== 1 ? "s" : ""}
          </Badge>
        ) : (
          <p className="text-sm text-green-700">All content queues healthy</p>
        )}
        {date && (
          <span className="text-xs text-muted-foreground">for {date}</span>
        )}
      </div>

      {Object.entries(byType).map(([contentKey, entries]) => (
        <div key={contentKey} className="space-y-1">
          <h3 className="text-sm font-medium">{contentKey}</h3>
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm bg-red-50 border border-red-200"
            >
              <span className="font-medium">{entry.creator}</span>
              <span className="text-xs text-red-600">
                {entry.available}/{entry.needed} available
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
