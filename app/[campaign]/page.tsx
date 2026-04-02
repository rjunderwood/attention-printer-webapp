"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusCard } from "@/components/layout/StatusCard";
import { api } from "@/lib/api";
import type {
  CampaignConfig,
  PlanNewShowResponse,
  PlanNewPreviewResponse,
  PlanNewQueueCheckResponse,
  OrchestratorStatus,
  Creator,
} from "@/lib/types";
import { toast } from "sonner";

export default function CampaignOverview() {
  const { campaign } = useParams<{ campaign: string }>();
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [show, setShow] = useState<PlanNewShowResponse | null>(null);
  const [preview, setPreview] = useState<PlanNewPreviewResponse | null>(null);
  const [queueCheck, setQueueCheck] = useState<PlanNewQueueCheckResponse | null>(null);
  const [orchestrator, setOrchestrator] = useState<OrchestratorStatus | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadData();
  }, [campaign]);

  async function loadData() {
    try {
      const [cfg, sh, prev, qc, orch, crt] = await Promise.allSettled([
        api.getConfig(campaign),
        api.getPlansNew(campaign, "active"),
        api.getPlansNewPreview(campaign, "active"),
        api.getPlansNewQueueCheck(campaign, "active"),
        api.getOrchestratorStatus(),
        api.getCreators(campaign),
      ]);
      if (cfg.status === "fulfilled") setConfig(cfg.value);
      if (sh.status === "fulfilled") setShow(sh.value);
      if (prev.status === "fulfilled") setPreview(prev.value);
      if (qc.status === "fulfilled") setQueueCheck(qc.value);
      if (orch.status === "fulfilled") setOrchestrator(orch.value);
      if (crt.status === "fulfilled") setCreators(crt.value.creators);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await api.confirmPlansNew(campaign, "active");
      toast.success("Plan confirmed");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {config && (
        <h2 className="text-base font-medium">{config.product}</h2>
      )}

      {show && (
        <StatusCard
          show={show}
          onConfirm={handleConfirm}
          loading={confirming}
        />
      )}

      {preview && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today&apos;s Summary</span>
              <Link
                href={`/${campaign}/plans`}
                className="text-xs text-muted-foreground"
              >
                Edit plan
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {preview.posting} posting · {preview.resting} resting · {preview.unassigned} unassigned
            </p>
          </CardContent>
        </Card>
      )}

      {queueCheck && queueCheck.total_shortfalls > 0 && (
        <Link href={`/${campaign}/plans`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Content Warnings</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  {queueCheck.total_shortfalls}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {queueCheck.shortfalls.length} creator{queueCheck.shortfalls.length !== 1 ? "s" : ""} with content shortfalls
              </p>
            </CardContent>
          </Card>
        </Link>
      )}

      {(() => {
        const warmupCreators = creators.filter(
          (c) => c.status === "account_warmup" || c.status === "posting_warmup"
        );
        if (warmupCreators.length === 0) return null;
        const acct = warmupCreators.filter((c) => c.status === "account_warmup").length;
        const posting = warmupCreators.filter((c) => c.status === "posting_warmup").length;
        return (
          <Link href={`/${campaign}/creators?status=Warmup`}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Creators in Warmup</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {warmupCreators.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {acct > 0 && `${acct} account warmup`}
                  {acct > 0 && posting > 0 && " · "}
                  {posting > 0 && `${posting} posting warmup`}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })()}

      {orchestrator?.creator_status && (() => {
        const statuses = Object.values(orchestrator.creator_status);
        const critical = statuses.filter((s) => s.days_available <= 3).length;
        const warning = statuses.filter((s) => s.days_available > 3 && s.days_available <= 7).length;
        if (critical === 0 && warning === 0) return null;
        return (
          <Link href={`/${campaign}/capacity`}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Creator Capacity</span>
                  {critical > 0 ? (
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {critical} critical
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">
                      {warning} low
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {critical > 0 && `${critical} creators with \u22643 days`}
                  {critical > 0 && warning > 0 && " · "}
                  {warning > 0 && `${warning} creators with 4\u20137 days`}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })()}

      {orchestrator && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Orchestrator</span>
              <Badge
                variant="outline"
                className={
                  orchestrator.last_main_run_minutes_ago > 120
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {orchestrator.last_main_run_minutes_ago > 120 ? "Down" : "Healthy"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Last run {orchestrator.last_main_run_minutes_ago}m ago · {orchestrator.total_runs} total runs
            </p>
            {orchestrator.last_errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {orchestrator.last_errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
