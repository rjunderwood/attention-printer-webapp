"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Creator, WarmupProgress } from "@/lib/types";
import { toast } from "sonner";

const STATUSES = ["All", "Active", "Paused", "Warmup", "Pending", "Archived"];

function isActiveStatus(status: string) {
  return status === "active" || status === "posting_warmup";
}

const statusLabel: Record<string, string> = {
  active: "Active",
  posting_warmup: "Warmup",
  paused: "Paused",
  account_warmup: "Acct Warmup",
  pending: "Pending",
  archived: "Archived",
};

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  posting_warmup: "bg-blue-100 text-blue-800",
  paused: "bg-red-100 text-red-800",
  account_warmup: "bg-yellow-100 text-yellow-800",
  pending: "bg-gray-100 text-gray-800",
  archived: "bg-gray-100 text-gray-500",
};

export default function CreatorsPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [warmupProgress, setWarmupProgress] = useState<Record<string, WarmupProgress>>({});
  const [warmupLoading, setWarmupLoading] = useState<string | null>(null);
  const [deviceNumber, setDeviceNumber] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [creatorsData, configData] = await Promise.allSettled([
          api.getCreators(campaign),
          api.getConfig(campaign),
        ]);
        if (creatorsData.status === "fulfilled") setCreators(creatorsData.value.creators);
        if (configData.status === "fulfilled") setRegions(configData.value.regions);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load creators");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign]);

  async function loadWarmupProgress(name: string) {
    try {
      const progress = await api.getWarmupProgress(campaign, name);
      setWarmupProgress((prev) => ({ ...prev, [name]: progress }));
    } catch {
      // Warmup data not available yet
    }
  }

  async function handleExpand(name: string, status: string) {
    if (expanded === name) {
      setExpanded(null);
      setPauseReason("");
      return;
    }
    setExpanded(name);
    setPauseReason("");
    setDeviceNumber("");
    if (status === "account_warmup" || status === "posting_warmup") {
      loadWarmupProgress(name);
    }
  }

  async function toggleCreator(name: string, currentlyActive: boolean) {
    setToggling(name);
    try {
      if (currentlyActive) {
        const reason = pauseReason.trim() || undefined;
        await api.pauseCreator(campaign, name, reason);
        toast.success(`Paused ${name}`);
        setCreators((prev) =>
          prev.map((c) =>
            c.name === name
              ? { ...c, status: "paused", inactive_reason: reason ?? "Manually paused" }
              : c
          )
        );
        setPauseReason("");
      } else {
        await api.resumeCreator(campaign, name);
        toast.success(`Resumed ${name}`);
        setCreators((prev) =>
          prev.map((c) =>
            c.name === name
              ? { ...c, status: "active", inactive_reason: undefined }
              : c
          )
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update creator");
    } finally {
      setToggling(null);
    }
  }

  async function handleStartWarmup(name: string) {
    const device = parseInt(deviceNumber);
    if (!device || device < 1 || device > 14) {
      toast.error("Enter a device number (1-14)");
      return;
    }
    setWarmupLoading(name);
    try {
      await api.startWarmup(campaign, name, device);
      toast.success(`Started account warmup for ${name} on device ${device}`);
      setCreators((prev) =>
        prev.map((c) =>
          c.name === name ? { ...c, status: "account_warmup", inactive_reason: undefined, warmup_device: device } : c
        )
      );
      setDeviceNumber("");
      loadWarmupProgress(name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start warmup");
    } finally {
      setWarmupLoading(null);
    }
  }

  async function handlePromoteWarmup(name: string) {
    const device = deviceNumber ? parseInt(deviceNumber) : undefined;
    if (device !== undefined && (device < 1 || device > 14)) {
      toast.error("Device number must be 1-14");
      return;
    }
    setWarmupLoading(name);
    try {
      await api.promoteWarmup(campaign, name, device);
      toast.success(`Promoted ${name} to posting warmup${device ? ` (moved to device ${device})` : ""}`);
      setCreators((prev) =>
        prev.map((c) =>
          c.name === name ? { ...c, status: "posting_warmup", inactive_reason: undefined, warmup_device: device ?? c.warmup_device } : c
        )
      );
      setDeviceNumber("");
      loadWarmupProgress(name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to promote");
    } finally {
      setWarmupLoading(null);
    }
  }

  async function handleRecordPost(name: string) {
    setWarmupLoading(name);
    try {
      const result = await api.recordWarmupPost(campaign, name);
      if (result.promoted) {
        toast.success(`${name} completed warmup and is now active!`);
        setCreators((prev) =>
          prev.map((c) =>
            c.name === name ? { ...c, status: "active", inactive_reason: undefined } : c
          )
        );
      } else {
        toast.success(
          `Recorded post for ${name} (${result.progress.posting_warmup.posts_completed}/${result.progress.posting_warmup.target_posts})`
        );
      }
      loadWarmupProgress(name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record post");
    } finally {
      setWarmupLoading(null);
    }
  }

  const filtered = creators.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (regionFilter !== "All" && c.region !== regionFilter) return false;
    if (statusFilter === "Active" && !isActiveStatus(c.status)) return false;
    if (statusFilter === "Paused" && c.status !== "paused") return false;
    if (statusFilter === "Warmup" && c.status !== "posting_warmup" && c.status !== "account_warmup") return false;
    if (statusFilter === "Pending" && c.status !== "pending") return false;
    if (statusFilter === "Archived" && c.status !== "archived") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search creators..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...regions].map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border min-h-[36px] ${
              regionFilter === r
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input text-muted-foreground"
            }`}
          >
            {r}
          </button>
        ))}
        <div className="w-px bg-border mx-1" />
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border min-h-[36px] ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-input text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} creators</p>

      <div className="space-y-1">
        {filtered.map((c) => (
          <div key={c.name}>
            <button
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 min-h-[48px] text-left"
              onClick={() => handleExpand(c.name, c.status)}
            >
              <div className="flex items-center gap-3">
                <img
                  src={`${c.profile_picture_url}`}
                  alt={c.name}
                  className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{c.name}</span>
                  {!isActiveStatus(c.status) && c.inactive_reason && (
                    <span className="text-xs text-muted-foreground">
                      {c.inactive_reason}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {c.region}
                </Badge>
              </div>
              <Badge
                variant="outline"
                className={statusColor[c.status] ?? "bg-gray-100 text-gray-800"}
              >
                {statusLabel[c.status] ?? c.status}
              </Badge>
            </button>

            {expanded === c.name && (
              <div className="px-3 pb-3 space-y-3">
                {/* Pending: Start warmup */}
                {c.status === "pending" && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      placeholder="Device number (1-14)"
                      value={deviceNumber}
                      onChange={(e) => setDeviceNumber(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => handleStartWarmup(c.name)}
                      disabled={warmupLoading === c.name || !deviceNumber}
                    >
                      {warmupLoading === c.name ? "..." : "Start Account Warmup"}
                    </Button>
                  </div>
                )}

                {/* Account warmup: Show progress + promote button */}
                {c.status === "account_warmup" && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {warmupProgress[c.name]?.account_warmup?.started_at && (
                        <p>Started {warmupProgress[c.name].account_warmup.started_at}</p>
                      )}
                      <p>Device {c.warmup_device ?? warmupProgress[c.name]?.warmup_device ?? "—"}</p>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      placeholder="New device number (optional)"
                      value={deviceNumber}
                      onChange={(e) => setDeviceNumber(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => handlePromoteWarmup(c.name)}
                      disabled={warmupLoading === c.name}
                    >
                      {warmupLoading === c.name ? "..." : "Promote to Posting Warmup"}
                    </Button>
                  </div>
                )}

                {/* Posting warmup: Show progress bar + record post */}
                {c.status === "posting_warmup" && (() => {
                  const wp = warmupProgress[c.name]?.posting_warmup;
                  const completed = wp?.posts_completed ?? 0;
                  const target = wp?.target_posts ?? 10;
                  const pct = Math.round((completed / target) * 100);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Device {c.warmup_device ?? warmupProgress[c.name]?.warmup_device ?? "—"}
                        </span>
                        <span className="font-medium">{completed}/{target} posts</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {wp?.posts && wp.posts.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {wp.posts.map((date) => (
                            <span
                              key={date}
                              className="text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"
                            >
                              {date}
                            </span>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="min-h-[44px]"
                        onClick={() => handleRecordPost(c.name)}
                        disabled={warmupLoading === c.name}
                      >
                        {warmupLoading === c.name ? "..." : "Record Warmup Post"}
                      </Button>
                    </div>
                  );
                })()}

                {/* Active / posting_warmup: Pause action */}
                {isActiveStatus(c.status) && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Pause reason (optional)"
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="min-h-[44px]"
                      onClick={() => toggleCreator(c.name, true)}
                      disabled={toggling === c.name}
                    >
                      {toggling === c.name ? "..." : "Pause Creator"}
                    </Button>
                  </div>
                )}

                {/* Paused: Resume action */}
                {c.status === "paused" && (
                  <Button
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => toggleCreator(c.name, false)}
                    disabled={toggling === c.name}
                  >
                    {toggling === c.name ? "..." : "Resume Creator"}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
