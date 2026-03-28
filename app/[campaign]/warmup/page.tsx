"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { CampaignConfig, Creator, WarmupPost } from "@/lib/types";
import { toast } from "sonner";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function todayAEST(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });
}

export default function WarmupPostingPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [posts, setPosts] = useState<WarmupPost[]>([]);
  const [date, setDate] = useState(todayAEST);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [warmupCreators, setWarmupCreators] = useState<Creator[]>([]);
  const [config, setConfig] = useState<CampaignConfig | null>(null);

  async function loadPosts(showSkeleton = true) {
    if (showSkeleton) setLoading(true);
    try {
      const data = await api.getWarmupPosting(campaign, date);
      setPosts(data.posts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load warmup posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [campaign, date]);

  useEffect(() => {
    async function loadCreators() {
      try {
        const [creatorsData, configData] = await Promise.allSettled([
          api.getCreators(campaign),
          api.getConfig(campaign),
        ]);
        if (creatorsData.status === "fulfilled") {
          setWarmupCreators(
            creatorsData.value.creators.filter(
              (c) => c.status === "account_warmup" || c.status === "posting_warmup"
            )
          );
        }
        if (configData.status === "fulfilled") setConfig(configData.value);
      } catch {
        // Non-critical, don't block the page
      }
    }
    loadCreators();
  }, [campaign]);

  async function markPlatform(
    creator: string,
    folder: string,
    platform: string
  ) {
    const key = `${creator}:${folder}:${platform}`;
    setMarking(key);
    try {
      const result = await api.markWarmupPosted(campaign, {
        creator,
        date,
        folder,
        platform,
      });
      const promoted = result.results.some((r) => r.promoted);
      if (promoted) {
        toast.success(`${creator} completed warmup and is now active!`);
      } else {
        toast.success(`Marked ${platform} as posted`);
      }
      loadPosts(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as posted");
    } finally {
      setMarking(null);
    }
  }

  async function markAllForPost(creator: string, folder: string) {
    const key = `${creator}:${folder}:all`;
    setMarking(key);
    try {
      const result = await api.markWarmupPosted(campaign, {
        creator,
        date,
        folder,
      });
      const promoted = result.results.some((r) => r.promoted);
      if (promoted) {
        toast.success(`${creator} completed warmup and is now active!`);
      } else {
        toast.success(`Marked all platforms for ${folder}`);
      }
      loadPosts(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as posted");
    } finally {
      setMarking(null);
    }
  }

  // Group posts by device
  const byDevice: Record<string, WarmupPost[]> = {};
  for (const post of posts) {
    if (!byDevice[post.device_id]) byDevice[post.device_id] = [];
    byDevice[post.device_id].push(post);
  }

  const totalPlatforms = posts.reduce((sum, p) => sum + p.platforms.length, 0);
  const postedPlatforms = posts.reduce(
    (sum, p) => sum + p.platforms.filter((pl) => pl.posted).length,
    0
  );
  const allDone = totalPlatforms > 0 && postedPlatforms === totalPlatforms;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 w-auto"
        />
        {totalPlatforms > 0 && (
          <Badge
            variant="outline"
            className={
              allDone
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }
          >
            {postedPlatforms}/{totalPlatforms} posted
          </Badge>
        )}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No warmup posts for {date}</p>
        </div>
      )}

      {Object.entries(byDevice).map(([deviceId, devicePosts]) => {
        const devicePosted = devicePosts.reduce(
          (sum, p) => sum + p.platforms.filter((pl) => pl.posted).length,
          0
        );
        const deviceTotal = devicePosts.reduce(
          (sum, p) => sum + p.platforms.length,
          0
        );
        return (
          <div key={deviceId} className="space-y-1">
            <div className="flex items-center gap-2 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {deviceId}
              </span>
              <Badge variant="outline" className="text-xs">
                {devicePosted}/{deviceTotal}
              </Badge>
            </div>

            {devicePosts.map((post) => {
              const unpostedPlatforms = post.platforms.filter(
                (p) => !p.posted && !p.failed
              );
              return (
                <div
                  key={`${post.creator}-${post.folder}`}
                  className={`p-3 rounded-lg border ${
                    post.all_posted
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                      : "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{post.creator}</span>
                      <Badge variant="outline" className="text-xs">
                        {post.region}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {post.folder.replace(/^post_\d+_/, "")}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {post.platforms.map((pl) => {
                      const key = `${post.creator}:${post.folder}:${pl.platform}`;
                      if (pl.posted) {
                        return (
                          <Badge
                            key={pl.platform}
                            variant="outline"
                            className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          >
                            {pl.platform} &check;
                          </Badge>
                        );
                      }
                      if (pl.failed) {
                        return (
                          <Badge
                            key={pl.platform}
                            variant="outline"
                            className="bg-red-100 text-red-800"
                            title={pl.error ?? undefined}
                          >
                            {pl.platform} &times;
                          </Badge>
                        );
                      }
                      return (
                        <Button
                          key={pl.platform}
                          size="sm"
                          variant="outline"
                          className="min-h-[36px] text-xs"
                          disabled={marking === key}
                          onClick={() =>
                            markPlatform(post.creator, post.folder, pl.platform)
                          }
                        >
                          {marking === key ? "..." : `${pl.platform} — ${formatTime(pl.scheduled_at)}`}
                        </Button>
                      );
                    })}

                    {unpostedPlatforms.length > 1 && (
                      <Button
                        size="sm"
                        className="min-h-[36px] text-xs"
                        disabled={marking === `${post.creator}:${post.folder}:all`}
                        onClick={() => markAllForPost(post.creator, post.folder)}
                      >
                        {marking === `${post.creator}:${post.folder}:all`
                          ? "..."
                          : "Mark All"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {warmupCreators.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground py-1">
            Creators in Warmup
          </p>
          {warmupCreators.map((c) => {
            const isPosting = c.status === "posting_warmup";
            const targetDays = config?.warmup?.account_warmup_days ?? 12;

            let pct = 0;
            let label = "";
            let barColor = "";

            if (isPosting) {
              const completed = c.warmup?.posting_warmup?.posts_completed ?? 0;
              const target = c.warmup?.posting_warmup?.target_posts ?? config?.warmup?.posting_warmup_target_posts ?? 10;
              pct = Math.round((completed / target) * 100);
              label = `${completed}/${target} posts`;
              barColor = "bg-blue-500";
            } else {
              const startedAt = c.warmup?.account_warmup?.started_at;
              if (startedAt) {
                const start = new Date(startedAt);
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                pct = Math.min(100, Math.round((elapsed / targetDays) * 100));
                label = `Day ${elapsed}/${targetDays}`;
              }
              barColor = "bg-yellow-500";
            }

            return (
              <div
                key={c.name}
                className="flex items-center justify-between p-3 rounded-lg border bg-background border-border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">{c.name}</span>
                  <Badge variant="outline" className="text-xs">{c.region}</Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      isPosting
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {isPosting ? "Posting" : "Account"}
                  </Badge>
                  {c.warmup_device != null && (
                    <span className="text-xs text-muted-foreground">
                      Device {c.warmup_device}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
