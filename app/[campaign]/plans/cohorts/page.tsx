"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { PlanNewCohort } from "@/lib/types";
import { toast } from "sonner";

export default function CohortsPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [cohorts, setCohorts] = useState<PlanNewCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [creatorsInput, setCreatorsInput] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadCohorts() {
    setLoading(true);
    try {
      const data = await api.getPlansNewCohorts(campaign);
      setCohorts(data.cohorts);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load cohorts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCohorts();
  }, [campaign]);

  async function handleAdd() {
    const creators = creatorsInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (creators.length === 0) return;

    setAdding(true);
    try {
      const result = await api.addPlansNewCohort(campaign, creators);
      if (result.warnings && result.warnings.length > 0) {
        toast.warning(`Cohort created with warnings: ${result.warnings.join(", ")}`);
      } else {
        toast.success("Cohort added");
      }
      setShowForm(false);
      setCreatorsInput("");
      loadCohorts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add cohort");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.deletePlansNewCohort(campaign, id);
      toast.success("Cohort removed");
      loadCohorts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove cohort");
    } finally {
      setDeleting(null);
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

  const inProgress = cohorts.filter((c) => c.status === "in_progress");
  const completed = cohorts.filter((c) => c.status === "completed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/${campaign}/plans?scope=warmup`} className="text-xs text-muted-foreground hover:text-foreground">
          Back to Dashboard
        </Link>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Cohort"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <span className="text-sm font-medium">Add New Cohort</span>
            <textarea
              placeholder="Enter creator names (comma or newline separated)"
              value={creatorsInput}
              onChange={(e) => setCreatorsInput(e.target.value)}
              className="w-full h-24 p-2 rounded-md border border-border bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" disabled={adding || !creatorsInput.trim()} onClick={handleAdd}>
              {adding ? "Adding..." : "Add Cohort"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* In-progress cohorts */}
      {inProgress.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground py-1">
            In Progress
          </p>
          {inProgress.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg border bg-background border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.id}</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                    in progress
                  </Badge>
                  {c.day != null && c.cycle_days != null && (
                    <span className="text-xs text-muted-foreground">
                      Day {c.day}/{c.cycle_days}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 text-xs"
                  disabled={deleting === c.id}
                  onClick={() => handleDelete(c.id)}
                >
                  {deleting === c.id ? "..." : "Remove"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.creators.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
              {c.started_at && (
                <p className="text-xs text-muted-foreground">
                  Started: {new Date(c.started_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completed cohorts */}
      {completed.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground py-1">
            Completed
          </p>
          {completed.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-lg border bg-background border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.id}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    completed
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {c.creators.length} creators
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.creators.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
              {c.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Completed: {new Date(c.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {cohorts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No cohorts yet</p>
      )}
    </div>
  );
}
