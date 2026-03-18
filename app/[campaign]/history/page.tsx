"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { HistoryEntry, HistoryDetail } from "@/lib/types";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function HistoryPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getHistory(campaign, 14);
        setHistory(data.history);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign]);

  async function toggleDate(date: string) {
    if (expandedDate === date) {
      setExpandedDate(null);
      setDetail(null);
      return;
    }

    setExpandedDate(date);
    setDetailLoading(true);
    try {
      const d = await api.getHistoryDetail(campaign, date);
      setDetail(d);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  }

  function planChanged(idx: number): boolean {
    if (idx >= history.length - 1) return false;
    const serialize = (groups: typeof history[0]["plan_snapshot"]["groups"]) =>
      JSON.stringify(
        groups
          .map((g) => ({ name: g.name, content_types: g.content_types }))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    return serialize(history[idx].plan_snapshot.groups) !== serialize(history[idx + 1].plan_snapshot.groups);
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>;
  }

  return (
    <div className="space-y-1">
      {history.map((entry, idx) => (
        <div key={entry.date}>
          <button
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 min-h-[48px] text-left"
            onClick={() => toggleDate(entry.date)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{entry.date}</span>
              {planChanged(idx) && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  plan changed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 text-xs">
                <span className="text-green-700">{entry.summary.posted}</span>
                {entry.summary.failed > 0 && (
                  <span className="text-red-600">{entry.summary.failed}</span>
                )}
                <span className="text-muted-foreground">{entry.summary.resting}r</span>
              </div>
              {expandedDate === entry.date ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedDate === entry.date && (
            <div className="px-3 pb-3">
              {detailLoading ? (
                <div className="animate-pulse h-20 bg-muted rounded" />
              ) : detail ? (
                <div className="space-y-1 rounded-lg border p-3">
                  <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                    <span>Groups: {detail.plan_snapshot.groups.map((g) => g.name).join(", ")}</span>
                  </div>
                  {Object.entries(detail.assignments).map(([creator, a]) => (
                    <div
                      key={creator}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span>{creator}</span>
                        <span className="text-xs text-muted-foreground">{a.region}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {a.status === "posted" && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            posted{a.scheduled ? ` (${a.scheduled})` : ""}
                          </Badge>
                        )}
                        {a.status === "failed" && (
                          <Badge className="bg-red-100 text-red-800 text-xs" title={a.error}>
                            failed
                          </Badge>
                        )}
                        {a.status === "rest" && (
                          <Badge variant="outline" className="text-xs">rest</Badge>
                        )}
                        {!["posted", "failed", "rest"].includes(a.status) && (
                          <Badge variant="outline" className="text-xs">{a.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
