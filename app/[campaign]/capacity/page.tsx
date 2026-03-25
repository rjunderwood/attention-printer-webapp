"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Creator, OrchestratorStatus } from "@/lib/types";
import { toast } from "sonner";

type CreatorCapacity = {
  name: string;
  region: string;
  creatorStatus: import("@/lib/types").CreatorStatus;
  profile_picture_url: string;
  status: string;
  max_posts_possible: number;
  days_available: number;
  last_deep_check?: string;
};

function urgencyLevel(days: number): "critical" | "warning" | "healthy" {
  if (days <= 3) return "critical";
  if (days <= 7) return "warning";
  return "healthy";
}

const urgencyColors = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  healthy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const barColors = {
  critical: "bg-red-500",
  warning: "bg-orange-500",
  healthy: "bg-green-500",
};

export default function CapacityPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [orchestrator, setOrchestrator] = useState<OrchestratorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [creatorsRes, orchRes] = await Promise.allSettled([
          api.getCreators(campaign),
          api.getOrchestratorStatus(),
        ]);
        if (creatorsRes.status === "fulfilled") setCreators(creatorsRes.value.creators);
        if (orchRes.status === "fulfilled") setOrchestrator(orchRes.value);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load capacity data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign]);

  const capacityData = useMemo(() => {
    if (!orchestrator) return [];
    const statuses = orchestrator.creator_status;
    return creators
      .filter((c) => statuses[c.name])
      .map((c): CreatorCapacity => ({
        name: c.name,
        region: c.region,
        creatorStatus: c.status,
        profile_picture_url: c.profile_picture_url,
        ...statuses[c.name],
      }))
      .sort((a, b) => a.days_available - b.days_available);
  }, [creators, orchestrator]);

  const maxDays = useMemo(
    () => Math.max(...capacityData.map((c) => c.days_available), 1),
    [capacityData]
  );

  const summary = useMemo(() => {
    const counts = { critical: 0, warning: 0, healthy: 0 };
    for (const c of capacityData) {
      counts[urgencyLevel(c.days_available)]++;
    }
    return counts;
  }, [capacityData]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (capacityData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No creator capacity data available. The orchestrator may not have run a deep check yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{summary.critical}</p>
            <p className="text-xs text-muted-foreground">&le; 3 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{summary.warning}</p>
            <p className="text-xs text-muted-foreground">4–7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.healthy}</p>
            <p className="text-xs text-muted-foreground">7+ days</p>
          </CardContent>
        </Card>
      </div>

      {/* Creator list */}
      <div className="space-y-1">
        {capacityData.map((c) => {
          const level = urgencyLevel(c.days_available);
          return (
            <div
              key={c.name}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50"
            >
              <img
                src={c.profile_picture_url}
                alt={c.name}
                className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {c.region}
                  </Badge>
                  {c.creatorStatus !== "active" && c.creatorStatus !== "posting_warmup" && (
                    <Badge variant="outline" className="text-xs bg-red-100 text-red-800 flex-shrink-0">
                      {c.creatorStatus === "paused" ? "Paused" : c.creatorStatus.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColors[level]}`}
                      style={{ width: `${Math.min((c.days_available / maxDays) * 100, 100)}%` }}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs flex-shrink-0 ${urgencyColors[level]}`}
                  >
                    {c.days_available}d
                  </Badge>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {c.max_posts_possible} posts left
                </p>
                {c.last_deep_check && (
                  <p className="text-xs text-muted-foreground">
                    checked {new Date(c.last_deep_check).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
