"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { GroupList } from "@/components/plan/GroupList";
import { PreviewPanel } from "@/components/plan/PreviewPanel";
import { ConfirmBar } from "@/components/plan/ConfirmBar";
import { ContentWarnings } from "@/components/plan/ContentWarnings";
import { StatusBadge } from "@/components/plan/StatusBadge";
import { api } from "@/lib/api";
import type {
  CampaignConfig,
  PlanGroup,
  PlanPreview,
  PlanStatus,
  ContentLevels,
} from "@/lib/types";
import { toast } from "sonner";

export default function PlanEditorPage() {
  const { campaign, date } = useParams<{ campaign: string; date: string }>();

  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [groups, setGroups] = useState<PlanGroup[]>([]);
  const [preview, setPreview] = useState<PlanPreview | null>(null);
  const [status, setStatus] = useState<PlanStatus | null>(null);
  const [contentLevels, setContentLevels] = useState<ContentLevels | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [planModified, setPlanModified] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  useEffect(() => {
    async function load() {
      const [cfg, plan, prev, sts, cl] = await Promise.allSettled([
        api.getConfig(campaign),
        api.getPlan(campaign),
        api.getPreview(campaign, date),
        api.getStatus(campaign),
        api.getContentLevels(campaign),
      ]);
      if (cfg.status === "fulfilled") setConfig(cfg.value);
      else toast.error("Failed to load config");
      if (plan.status === "fulfilled") setGroups(plan.value.plan.groups);
      else toast.error("Failed to load plan");
      if (prev.status === "fulfilled") setPreview(prev.value);
      if (sts.status === "fulfilled") setStatus(sts.value);
      if (cl.status === "fulfilled") setContentLevels(cl.value);
      setLoading(false);
    }
    load();
  }, [campaign, date]);

  // Poll status every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const sts = await api.getStatus(campaign);
        setStatus((prev) => {
          if (prev?.status === "pending" && sts.status !== "pending" && sts.status !== "none") {
            toast.info(`Plan status changed to ${sts.status}`);
          }
          return sts;
        });
      } catch {
        // silent
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [campaign]);

  // Countdown timer
  useEffect(() => {
    if (!status || status.status !== "pending" || !status.notification_sent_at || !config) {
      setCountdown(null);
      return;
    }

    function updateCountdown() {
      const sentAt = new Date(status!.notification_sent_at!).getTime();
      const windowMs = config!.daily_cycle.confirmation_window_minutes * 60 * 1000;
      const deadline = sentAt + windowMs;
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        setCountdown("Auto-confirming...");
        return;
      }

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins}m ${secs}s remaining`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [status, config]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Refresh preview (debounced)
  const refreshPreview = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const prev = await api.getPreview(campaign, date);
        setPreview(prev);
      } catch {
        // silent
      } finally {
        setPreviewLoading(false);
      }
    }, 500);
  }, [campaign, date]);

  async function handleUpdateGroup(group: PlanGroup) {
    try {
      const result = await api.setPlanGroup(campaign, {
        content_type: group.content_type,
        region: group.region,
        count: group.count,
        group: group.name,
      });
      setGroups(result.plan.groups);
      setPlanModified(true);
      refreshPreview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update group");
    }
  }

  async function handleRemoveGroup(name: string) {
    try {
      const result = await api.removeGroup(campaign, name);
      setGroups(result.plan.groups);
      setPlanModified(true);
      refreshPreview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove group");
    }
  }

  async function handleAddGroup() {
    const name = `group-${Date.now().toString(36)}`;
    try {
      const result = await api.setPlanGroup(campaign, {
        content_type: null,
        group: name,
      });
      setGroups(result.plan.groups);
      setPlanModified(true);
      refreshPreview();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add group");
    }
  }

  async function handleReset() {
    try {
      const result = await api.resetPlan(campaign);
      setGroups(result.plan.groups);
      setPlanModified(true);
      refreshPreview();
      toast.success("Plan reset to default");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await api.confirmPlan(campaign, planModified);
      toast.success("Plan confirmed");
      setPlanModified(false);
      const sts = await api.getStatus(campaign);
      setStatus(sts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse pb-20">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Target: {date}</p>
          {status && <StatusBadge status={status.status} />}
        </div>
        {countdown && (
          <span className="text-xs text-muted-foreground">{countdown}</span>
        )}
      </div>

      {/* Plan Groups */}
      {config && (
        <GroupList
          groups={groups}
          config={config}
          onUpdateGroup={handleUpdateGroup}
          onRemoveGroup={handleRemoveGroup}
          onAddGroup={handleAddGroup}
          onReset={handleReset}
          disabled={confirming}
        />
      )}

      {/* Live Preview */}
      <PreviewPanel preview={preview} loading={previewLoading} />

      {/* Content Warnings */}
      <ContentWarnings levels={contentLevels} />

      {/* Sticky Confirm Bar */}
      <ConfirmBar
        status={status?.status || "none"}
        planModified={planModified}
        countdown={countdown}
        onConfirm={handleConfirm}
        loading={confirming}
      />
    </div>
  );
}
