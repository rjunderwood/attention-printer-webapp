"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { PlanScope, PlanNewTemplate } from "@/lib/types";
import { toast } from "sonner";

export default function PlansTemplatesPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const searchParams = useSearchParams();
  const initialScope = (searchParams.get("scope") as PlanScope) || "active";

  const [scope, setScope] = useState<PlanScope>(initialScope);
  const [templates, setTemplates] = useState<PlanNewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState(3);
  const [newAutoRest, setNewAutoRest] = useState(true);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await api.getPlansNewTemplates(campaign, scope);
      setTemplates(data.templates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, [campaign, scope]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.createPlansNewTemplate(campaign, {
        scope,
        name: newName.trim(),
        cycle_days: newDays,
        auto_rest: newAutoRest,
      });
      toast.success("Template created");
      setShowForm(false);
      setNewName("");
      setNewDays(3);
      setNewAutoRest(true);
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(id: string) {
    setActivating(id);
    try {
      await api.activatePlansNewTemplate(campaign, scope, id);
      toast.success("Template activated");
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate");
    } finally {
      setActivating(null);
    }
  }

  async function handleDeactivate() {
    try {
      await api.deactivatePlansNewTemplate(campaign, scope);
      toast.success("Template deactivated");
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to deactivate");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.deletePlansNewTemplate(campaign, id, scope);
      toast.success("Template deleted");
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
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

      <div className="flex items-center justify-between">
        <Link href={`/${campaign}/plans`} className="text-xs text-muted-foreground hover:text-foreground">
          Back to Dashboard
        </Link>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Template"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Template name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10"
              />
              <div className="flex gap-3 items-center">
                <label className="text-sm text-muted-foreground">Cycle days:</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={newDays}
                  onChange={(e) => setNewDays(Number(e.target.value))}
                  className="h-10 w-20"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newAutoRest}
                    onChange={(e) => setNewAutoRest(e.target.checked)}
                  />
                  Auto-rest
                </label>
              </div>
            </div>
            <Button size="sm" disabled={creating || !newName.trim()} onClick={handleCreate}>
              {creating ? "Creating..." : "Create Template"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template list */}
      {templates.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No templates yet</p>
      )}

      {templates.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-background border-border min-h-[48px]"
        >
          <Link
            href={`/${campaign}/plans/templates/${t.id}?scope=${scope}`}
            className="flex items-center gap-2 min-w-0 flex-1 hover:text-foreground"
          >
            <span className="text-sm font-medium truncate">{t.name}</span>
            <Badge variant="outline" className="text-xs">{t.cycle_days}d</Badge>
            {t.auto_rest && <Badge variant="outline" className="text-xs">auto-rest</Badge>}
            {t.active && (
              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">active</Badge>
            )}
          </Link>
          <div className="flex gap-1 shrink-0 ml-2">
            {t.active ? (
              <Button size="sm" variant="outline" onClick={handleDeactivate}>
                Deactivate
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={activating === t.id}
                  onClick={() => handleActivate(t.id)}
                >
                  {activating === t.id ? "..." : "Activate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  disabled={deleting === t.id}
                  onClick={() => handleDelete(t.id)}
                >
                  {deleting === t.id ? "..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
