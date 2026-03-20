"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Failure } from "@/lib/types";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  auth_expired: { label: "Auth Expired", color: "bg-purple-100 text-purple-800" },
  content_rejected: { label: "Content Rejected", color: "bg-red-100 text-red-800" },
  quota_exceeded: { label: "Quota Exceeded", color: "bg-yellow-100 text-yellow-800" },
};

function categoryBadge(category: string) {
  const cfg = CATEGORY_LABELS[category] ?? {
    label: category.replace(/_/g, " "),
    color: "bg-gray-100 text-gray-800",
  };
  return (
    <Badge variant="outline" className={`text-xs ${cfg.color}`}>
      {cfg.label}
    </Badge>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FailuresPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [dismissingAll, setDismissingAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getFailures(campaign);
        setFailures(data.failures);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load failures");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign]);

  function failureKey(f: Failure) {
    return `${f.post_bridge_id}:${f.platform}`;
  }

  async function dismiss(f: Failure) {
    const key = failureKey(f);
    setDismissing(key);
    try {
      await api.acknowledgeFailure(campaign, key);
      setFailures((prev) => prev.filter((x) => failureKey(x) !== key));
      toast.success("Failure dismissed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss");
    } finally {
      setDismissing(null);
    }
  }

  async function dismissAll() {
    setDismissingAll(true);
    try {
      const result = await api.acknowledgeAllFailures(campaign);
      setFailures([]);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss all");
    } finally {
      setDismissingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (failures.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No open failures</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {failures.length} open {failures.length === 1 ? "failure" : "failures"}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="min-h-[36px]"
          onClick={dismissAll}
          disabled={dismissingAll}
        >
          {dismissingAll ? "..." : "Dismiss All"}
        </Button>
      </div>

      <div className="space-y-1">
        {failures.map((f) => {
          const key = failureKey(f);
          const isExpanded = expanded === key;
          return (
            <div key={key}>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 min-h-[48px] text-left"
                onClick={() => setExpanded(isExpanded ? null : key)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{f.creator}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {f.platform}
                  </Badge>
                  {categoryBadge(f.error_category)}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatTime(f.detected_at)}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  <p className="text-sm text-muted-foreground">{f.error}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Scheduled: {formatTime(f.scheduled_at)}</span>
                    <span>Media ID: {f.media_id}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => dismiss(f)}
                    disabled={dismissing === key || dismissingAll}
                  >
                    {dismissing === key ? "..." : "Dismiss"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
