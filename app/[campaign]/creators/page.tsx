"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Creator } from "@/lib/types";
import { toast } from "sonner";

const STATUSES = ["All", "Active", "Paused"];

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

  async function toggleCreator(name: string, currentlyActive: boolean) {
    setToggling(name);
    try {
      if (currentlyActive) {
        await api.pauseCreator(campaign, name);
        toast.success(`Paused ${name}`);
      } else {
        await api.resumeCreator(campaign, name);
        toast.success(`Resumed ${name}`);
      }
      setCreators((prev) =>
        prev.map((c) =>
          c.name === name ? { ...c, active: !currentlyActive } : c
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update creator");
    } finally {
      setToggling(null);
    }
  }

  const filtered = creators.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (regionFilter !== "All" && c.region !== regionFilter) return false;
    if (statusFilter === "Active" && !c.active) return false;
    if (statusFilter === "Paused" && c.active) return false;
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
              onClick={() => setExpanded(expanded === c.name ? null : c.name)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                <Badge variant="outline" className="text-xs">
                  {c.region}
                </Badge>
              </div>
              <Badge
                variant="outline"
                className={
                  c.active
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {c.active ? "Active" : "Paused"}
              </Badge>
            </button>

            {expanded === c.name && (
              <div className="px-3 pb-3">
                <Button
                  size="sm"
                  variant={c.active ? "destructive" : "default"}
                  className="min-h-[44px]"
                  onClick={() => toggleCreator(c.name, c.active)}
                  disabled={toggling === c.name}
                >
                  {toggling === c.name
                    ? "..."
                    : c.active
                      ? "Pause Creator"
                      : "Resume Creator"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
