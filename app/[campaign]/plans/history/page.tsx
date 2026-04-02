"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type {
  PlanScope,
  PlanNewHistoryEntry,
  PlanNewHistoryDetail,
  PlanNewAdjustment,
  PlanNewTemplateHistoryEntry,
} from "@/lib/types";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function PlansHistoryPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const searchParams = useSearchParams();
  const initialScope = (searchParams.get("scope") as PlanScope) || "active";

  const [scope, setScope] = useState<PlanScope>(initialScope);
  const [tab, setTab] = useState<"history" | "adjustments" | "templates">("history");
  const [history, setHistory] = useState<PlanNewHistoryEntry[]>([]);
  const [adjustments, setAdjustments] = useState<PlanNewAdjustment[]>([]);
  const [templateHistory, setTemplateHistory] = useState<PlanNewTemplateHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<PlanNewHistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (tab === "history") {
          const data = await api.getPlansNewHistory(campaign, scope, 14);
          setHistory(Array.isArray(data.history) ? data.history : []);
        } else if (tab === "adjustments") {
          const data = await api.getPlansNewAdjustments(campaign, scope);
          setAdjustments(data.adjustments);
        } else {
          const data = await api.getPlansNewTemplateHistory(campaign, scope);
          setTemplateHistory(data.entries);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign, scope, tab]);

  async function toggleDate(date: string) {
    if (expandedDate === date) {
      setExpandedDate(null);
      setDayDetail(null);
      return;
    }
    setExpandedDate(date);
    setDetailLoading(true);
    try {
      const data = await api.getPlansNewHistory(campaign, scope, undefined, date);
      setDayDetail(!Array.isArray(data.history) ? data.history : null);
    } catch {
      // silent
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Scope tabs */}
      <div className="flex gap-1 border-b">
        {(["active", "warmup"] as PlanScope[]).map((s) => (
          <button
            key={s}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              scope === s
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setScope(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/${campaign}/plans`} className="text-xs text-muted-foreground hover:text-foreground">
          Back to Dashboard
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b">
        {(["history", "adjustments", "templates"] as const).map((t) => (
          <button
            key={t}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted rounded" />
          ))}
        </div>
      ) : tab === "history" ? (
        <div className="space-y-1">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No history yet</p>
          )}
          {history.map((entry) => (
            <div key={entry.date}>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 min-h-[48px] text-left"
                onClick={() => toggleDate(entry.date)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.date}</span>
                  {entry.cycle_day != null && (
                    <Badge variant="outline" className="text-xs">Day {entry.cycle_day}</Badge>
                  )}
                  {entry.adjusted && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                      adjusted
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-700">{entry.summary.posted}</span>
                    {entry.summary.failed > 0 && <span className="text-red-600">{entry.summary.failed}</span>}
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
                  ) : dayDetail ? (
                    <div className="space-y-1 rounded-lg border p-3">
                      {Object.entries(dayDetail.summary.by_group).map(([name, stats]) => (
                        <div key={name} className="flex items-center justify-between text-sm py-1">
                          <span className="font-medium">{name}</span>
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-700">{stats.posted} posted</span>
                            {stats.failed > 0 && (
                              <span className="text-red-600">{stats.failed} failed</span>
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
      ) : tab === "adjustments" ? (
        <div className="space-y-1">
          {adjustments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No adjustments</p>
          )}
          {adjustments.map((a, i) => (
            <div key={i} className="p-3 rounded-lg border bg-background border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{a.date}</span>
                  {a.cycle_day != null && (
                    <Badge variant="outline" className="text-xs">Day {a.cycle_day}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.adjusted_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {templateHistory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No template history</p>
          )}
          {templateHistory.map((entry, i) => (
            <div key={i} className="p-3 rounded-lg border bg-background border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{entry.template_name}</span>
                  <Badge variant="outline" className="text-xs">{entry.template_id}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{entry.status}</Badge>
                  <span className="text-xs text-muted-foreground">{entry.generation_count} generations</span>
                  <span className="text-xs text-muted-foreground">{entry.cycles_completed} cycles</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(entry.activated_at).toLocaleDateString()}
                {entry.ended_at ? ` — ${new Date(entry.ended_at).toLocaleDateString()}` : " — present"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
