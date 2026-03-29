"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type {
  PlanScope,
  PlanNewShowResponse,
  PlanNewPreviewAssignment,
  PlanNewQueueWarning,
  PlanNewContentItem,
} from "@/lib/types";
import { toast } from "sonner";

export default function PlansDashboard() {
  const { campaign } = useParams<{ campaign: string }>();
  const [scope, setScope] = useState<PlanScope>("active");
  const [show, setShow] = useState<PlanNewShowResponse | null>(null);
  const [preview, setPreview] = useState<PlanNewPreviewAssignment[]>([]);
  const [warnings, setWarnings] = useState<PlanNewQueueWarning[]>([]);
  const [previewDate, setPreviewDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Adjust state
  const [adjustGroup, setAdjustGroup] = useState<string | null>(null);
  const [adjustContent, setAdjustContent] = useState<PlanNewContentItem[]>([{ content_category: "", content_type: "" }]);
  const [adjustRegion, setAdjustRegion] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [showRes, prevRes, queueRes] = await Promise.allSettled([
        api.getPlansNew(campaign, scope),
        api.getPlansNewPreview(campaign, scope, previewDate || undefined),
        api.getPlansNewQueueCheck(campaign, scope),
      ]);
      if (showRes.status === "fulfilled") setShow(showRes.value);
      else setShow(null);
      if (prevRes.status === "fulfilled") setPreview(prevRes.value.assignments);
      else setPreview([]);
      if (queueRes.status === "fulfilled") setWarnings(queueRes.value.warnings);
      else setWarnings([]);
    } catch {
      toast.error("Failed to load plan data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [campaign, scope, previewDate]);

  async function handleConfirm(refresh?: boolean) {
    setConfirming(true);
    try {
      await api.confirmPlansNew(campaign, scope, refresh);
      toast.success("Plan confirmed");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  async function handleAdjust() {
    if (!adjustGroup) return;
    setAdjusting(true);
    try {
      const content = adjustContent.filter((c) => c.content_category && c.content_type);
      await api.adjustPlansNew(campaign, {
        scope,
        group: adjustGroup,
        ...(content.length > 0 ? { content } : {}),
        ...(adjustRegion ? { region: adjustRegion } : {}),
      });
      toast.success("Adjustment saved");
      setAdjustGroup(null);
      setAdjustContent([{ content_category: "", content_type: "" }]);
      setAdjustRegion("");
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust");
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  // Group preview assignments by group name
  const byGroup: Record<string, PlanNewPreviewAssignment[]> = {};
  for (const a of preview) {
    if (!byGroup[a.group]) byGroup[a.group] = [];
    byGroup[a.group].push(a);
  }

  // For warmup, group by cohort
  const byCohort: Record<string, PlanNewPreviewAssignment[]> = {};
  if (scope === "warmup") {
    for (const a of preview) {
      const key = a.cohort_id || "unknown";
      if (!byCohort[key]) byCohort[key] = [];
      byCohort[key].push(a);
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

      {/* Navigation links */}
      <div className="flex gap-2 text-xs">
        <Link href={`/${campaign}/plans/templates?scope=${scope}`} className="text-muted-foreground hover:text-foreground">
          Templates
        </Link>
        {scope === "warmup" && (
          <Link href={`/${campaign}/plans/cohorts`} className="text-muted-foreground hover:text-foreground">
            Cohorts
          </Link>
        )}
        <Link href={`/${campaign}/plans/history?scope=${scope}`} className="text-muted-foreground hover:text-foreground">
          History
        </Link>
      </div>

      {!show?.active ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No template active</p>
            <Link href={`/${campaign}/plans/templates?scope=${scope}`}>
              <Button size="sm">Select Template</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Template info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{show.template_name}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">active</Badge>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {show.cycle_day != null && show.cycle_days != null && (
                  <span>Day {show.cycle_day}/{show.cycle_days}</span>
                )}
                {show.cycle_count != null && (
                  <span>Cycle {show.cycle_count}</span>
                )}
                {show.auto_rest != null && (
                  <span>Auto-rest: {show.auto_rest ? "on" : "off"}</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation status */}
          {show.confirmation && show.confirmation.status !== "none" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Confirmation</span>
                    <Badge
                      variant="outline"
                      className={
                        show.confirmation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      {show.confirmation.status}
                    </Badge>
                  </div>
                  {show.confirmation.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={confirming}
                        onClick={() => handleConfirm(true)}
                      >
                        {confirming ? "..." : "Refresh & Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        disabled={confirming}
                        onClick={() => handleConfirm()}
                      >
                        {confirming ? "..." : "Confirm"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current day groups */}
          {show.current_day_groups && show.current_day_groups.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <span className="text-sm font-medium">Current Day Groups</span>
                {show.current_day_groups.map((g) => (
                  <div key={g.name} className="space-y-2 py-1 border-b last:border-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.name}</span>
                        {g.region && <Badge variant="outline" className="text-xs">{g.region}</Badge>}
                        {g.type && <Badge variant="outline" className="text-xs">{g.type}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {g.rest ? "REST" : g.content?.map((c) => `${c.content_category}/${c.content_type}`).join(", ")}
                        </span>
                        {show.confirmation?.status === "pending" && !g.rest && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setAdjustGroup(adjustGroup === g.name ? null : g.name);
                              setAdjustContent(g.content || [{ content_category: "", content_type: "" }]);
                              setAdjustRegion(g.region || "");
                            }}
                          >
                            {adjustGroup === g.name ? "Cancel" : "Adjust"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Inline adjust form */}
                    {adjustGroup === g.name && (
                      <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                        <span className="text-xs text-muted-foreground">Content items:</span>
                        {adjustContent.map((c, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <Input
                              placeholder="content_category"
                              value={c.content_category}
                              onChange={(e) => {
                                const updated = [...adjustContent];
                                updated[i] = { ...updated[i], content_category: e.target.value };
                                setAdjustContent(updated);
                              }}
                              className="h-8 text-xs"
                            />
                            <Input
                              placeholder="content_type"
                              value={c.content_type}
                              onChange={(e) => {
                                const updated = [...adjustContent];
                                updated[i] = { ...updated[i], content_type: e.target.value };
                                setAdjustContent(updated);
                              }}
                              className="h-8 text-xs"
                            />
                            {adjustContent.length > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8 px-2"
                                onClick={() => setAdjustContent(adjustContent.filter((_, j) => j !== i))}
                              >
                                x
                              </Button>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-2 items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => setAdjustContent([...adjustContent, { content_category: "", content_type: "" }])}
                          >
                            + Item
                          </Button>
                          <Input
                            placeholder="Region (optional)"
                            value={adjustRegion}
                            onChange={(e) => setAdjustRegion(e.target.value)}
                            className="h-8 text-xs w-32"
                          />
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            disabled={adjusting}
                            onClick={handleAdjust}
                          >
                            {adjusting ? "..." : "Save Adjustment"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Preview</span>
                    <Input
                      type="date"
                      value={previewDate}
                      onChange={(e) => setPreviewDate(e.target.value)}
                      className="h-8 w-auto text-xs"
                    />
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-700">
                      {preview.filter((a) => a.action === "post").length} posting
                    </span>
                    <span className="text-muted-foreground">
                      {preview.filter((a) => a.action === "rest").length} rest
                    </span>
                    <span className="text-muted-foreground">
                      {preview.filter((a) => a.action === "skip").length} skip
                    </span>
                  </div>
                </div>

                {scope === "warmup" ? (
                  Object.entries(byCohort).map(([cohortId, assignments]) => (
                    <div key={cohortId} className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-1">
                        Cohort {cohortId}
                        {assignments[0]?.cohort_day != null && ` — Day ${assignments[0].cohort_day}`}
                      </p>
                      {assignments.map((a) => (
                        <div key={a.creator} className="flex items-center justify-between text-sm py-0.5">
                          <div className="flex items-center gap-2">
                            <span>{a.creator}</span>
                            {a.region && <span className="text-xs text-muted-foreground">{a.region}</span>}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              a.action === "post"
                                ? "bg-green-100 text-green-800"
                                : a.action === "rest"
                                ? "bg-gray-100 text-gray-800"
                                : ""
                            }`}
                          >
                            {a.action}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  Object.entries(byGroup).map(([group, assignments]) => (
                    <div key={group} className="space-y-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground pt-1">
                        {group}
                      </p>
                      {assignments.map((a) => (
                        <div key={a.creator} className="flex items-center justify-between text-sm py-0.5">
                          <div className="flex items-center gap-2">
                            <span>{a.creator}</span>
                            {a.region && <span className="text-xs text-muted-foreground">{a.region}</span>}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              a.action === "post"
                                ? "bg-green-100 text-green-800"
                                : a.action === "rest"
                                ? "bg-gray-100 text-gray-800"
                                : ""
                            }`}
                          >
                            {a.action}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Queue warnings */}
          {warnings.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Queue Warnings</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    {warnings.length}
                  </Badge>
                </div>
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{w.creator}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.content_category}/{w.content_type}
                      </span>
                    </div>
                    <span className="text-xs text-red-600">
                      {w.available}/{w.needed} available
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Warmup cohorts summary */}
          {scope === "warmup" && show.cohorts && show.cohorts.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Cohorts</span>
                  <Link href={`/${campaign}/plans/cohorts`} className="text-xs text-muted-foreground">
                    Manage
                  </Link>
                </div>
                {show.cohorts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.id}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          c.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.creators.length} creators
                      {c.day != null && c.cycle_days != null && ` · Day ${c.day}/${c.cycle_days}`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
