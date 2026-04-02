"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/plan/StatusBadge";
import { api } from "@/lib/api";
import type { CampaignConfig, PlanNewShowResponse, PlanNewQueueCheckResponse } from "@/lib/types";
import { toast } from "sonner";

interface CampaignData {
  name: string;
  config: CampaignConfig | null;
  show: PlanNewShowResponse | null;
  queueCheck: PlanNewQueueCheckResponse | null;
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { campaigns: names } = await api.getCampaigns();
      const data = await Promise.all(
        names.map(async (name) => {
          const [config, show, queueCheck] = await Promise.allSettled([
            api.getConfig(name),
            api.getPlansNew(name, "active"),
            api.getPlansNewQueueCheck(name, "active"),
          ]);
          return {
            name,
            config: config.status === "fulfilled" ? config.value : null,
            show: show.status === "fulfilled" ? show.value : null,
            queueCheck: queueCheck.status === "fulfilled" ? queueCheck.value : null,
          };
        })
      );
      setCampaigns(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(campaign: string) {
    setConfirming(campaign);
    try {
      await api.confirmPlansNew(campaign, "active");
      toast.success(`Confirmed plan for ${campaign}`);
      loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setConfirming(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      {campaigns.length === 0 && (
        <p className="text-sm text-muted-foreground">No campaigns found.</p>
      )}

      {campaigns.map((c) => (
        <Link key={c.name} href={`/${c.name}`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {c.config?.product || c.name}
                </span>
                {c.show?.confirmation && (
                  <StatusBadge status={c.show.confirmation.status} />
                )}
              </div>

              {c.show?.active && c.show.template_name && (
                <p className="text-sm text-muted-foreground">
                  {c.show.template_name}
                  {c.show.cycle_day != null && c.show.cycle_days != null && ` · Day ${c.show.cycle_day}/${c.show.cycle_days}`}
                </p>
              )}

              {c.queueCheck && c.queueCheck.total_shortfalls > 0 && (
                <p className="text-sm text-orange-600">
                  {c.queueCheck.total_shortfalls} content shortfall{c.queueCheck.total_shortfalls !== 1 ? "s" : ""}
                </p>
              )}

              {c.show?.confirmation?.status === "pending" && (
                <Button
                  size="sm"
                  className="min-h-[44px] mt-1"
                  onClick={(e) => {
                    e.preventDefault();
                    handleConfirm(c.name);
                  }}
                  disabled={confirming === c.name}
                >
                  {confirming === c.name ? "Confirming..." : "Confirm"}
                </Button>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
