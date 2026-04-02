"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type {
  PlanScope,
  PlanNewTemplate,
  PlanNewGroup,
  PlanNewContentItem,
  PlanNewTemplateValidation,
} from "@/lib/types";
import { toast } from "sonner";

export default function TemplateDetailPage() {
  const { campaign, id } = useParams<{ campaign: string; id: string }>();
  const searchParams = useSearchParams();
  const scope = (searchParams.get("scope") as PlanScope) || "active";

  const [template, setTemplate] = useState<PlanNewTemplate | null>(null);
  const [validation, setValidation] = useState<PlanNewTemplateValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [cloning, setCloning] = useState(false);

  // Add group form
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupRegion, setGroupRegion] = useState("");
  const [groupType, setGroupType] = useState("");
  const [groupCreators, setGroupCreators] = useState("");
  const [groupCount, setGroupCount] = useState<number | undefined>();
  const [groupRest, setGroupRest] = useState(false);
  const [groupContent, setGroupContent] = useState<PlanNewContentItem[]>([
    { content_category: "", content_type: "" },
  ]);

  // Clone form
  const [showClone, setShowClone] = useState(false);
  const [cloneName, setCloneName] = useState("");

  async function loadTemplate() {
    setLoading(true);
    try {
      const data = await api.getPlansNewTemplate(campaign, id, scope);
      setTemplate(data.template);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplate();
  }, [campaign, id, scope]);

  function resetGroupForm() {
    setGroupName("");
    setGroupRegion("");
    setGroupType("");
    setGroupCreators("");
    setGroupCount(undefined);
    setGroupRest(false);
    setGroupContent([{ content_category: "", content_type: "" }]);
    setShowAddGroup(false);
  }

  async function handleAddGroup() {
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      const group: PlanNewGroup = { name: groupName.trim() };
      if (groupRest) {
        group.rest = true;
      } else {
        group.content = groupContent.filter((c) => c.content_category && c.content_type);
      }
      if (groupRegion) group.region = groupRegion;
      if (groupType) group.creator_type = groupType;
      if (groupCreators) group.creators = groupCreators.split(",").map((s) => s.trim()).filter(Boolean);
      if (groupCount != null && groupCount > 0) group.count = groupCount;

      await api.setPlansNewTemplateDay(campaign, id, {
        scope,
        day: activeDay,
        group,
      });
      toast.success("Group added");
      resetGroupForm();
      loadTemplate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add group");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveGroup(dayNum: number, groupName: string) {
    try {
      await api.removePlansNewTemplateGroup(campaign, id, {
        scope,
        day: dayNum,
        group_name: groupName,
      });
      toast.success("Group removed");
      loadTemplate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove group");
    }
  }

  async function handleValidate() {
    setValidating(true);
    try {
      const result = await api.validatePlansNewTemplate(campaign, id, scope);
      setValidation(result);
      if (result.valid) toast.success("Template is valid");
      else toast.error("Template has validation errors");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to validate");
    } finally {
      setValidating(false);
    }
  }

  async function handleClone() {
    if (!cloneName.trim()) return;
    setCloning(true);
    try {
      await api.clonePlansNewTemplate(campaign, id, {
        scope,
        name: cloneName.trim(),
      });
      toast.success("Template cloned");
      setShowClone(false);
      setCloneName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clone");
    } finally {
      setCloning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded" />
        ))}
      </div>
    );
  }

  if (!template) {
    return <p className="text-sm text-muted-foreground">Template not found.</p>;
  }

  const currentDay = template.days?.[String(activeDay)];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/${campaign}/plans/templates?scope=${scope}`}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Back to Templates
        </Link>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowClone(!showClone)}>
            Clone
          </Button>
          <Button size="sm" variant="outline" disabled={validating} onClick={handleValidate}>
            {validating ? "..." : "Validate"}
          </Button>
        </div>
      </div>

      {/* Template header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{template.name}</span>
            <Badge variant="outline" className="text-xs">{template.cycle_days}d cycle</Badge>
            {template.auto_rest && <Badge variant="outline" className="text-xs">auto-rest</Badge>}
            {template.active && (
              <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">active</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation result */}
      {validation && !validation.valid && (
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-sm font-medium text-red-600">Validation Errors</span>
            {validation.errors?.map((err, i) => (
              <p key={i} className="text-xs text-red-600">{err}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Clone form */}
      {showClone && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <span className="text-sm font-medium">Clone Template</span>
            <Input
              placeholder="New template name"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              className="h-10"
            />
            <Button size="sm" disabled={cloning || !cloneName.trim()} onClick={handleClone}>
              {cloning ? "Cloning..." : "Clone"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {Array.from({ length: template.cycle_days }, (_, i) => i + 1).map((d) => (
          <button
            key={d}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeDay === d
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveDay(d)}
          >
            Day {d}
          </button>
        ))}
      </div>

      {/* Day groups */}
      {currentDay && currentDay.groups && currentDay.groups.length > 0 ? (
        <div className="space-y-2">
          {currentDay.groups.map((g) => (
            <div
              key={g.name}
              className="p-3 rounded-lg border bg-background border-border space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{g.name}</span>
                  {g.region && <Badge variant="outline" className="text-xs">{g.region}</Badge>}
                  {g.creator_type && <Badge variant="outline" className="text-xs">{g.creator_type}</Badge>}
                  {g.count != null && <Badge variant="outline" className="text-xs">count: {g.count}</Badge>}
                  {g.rest && <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">REST</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      setShowAddGroup(true);
                      setGroupName(g.name);
                      setGroupRest(!!g.rest);
                      setGroupContent(g.content && g.content.length > 0 ? [...g.content] : [{ content_category: "", content_type: "" }]);
                      setGroupRegion(g.region || "");
                      setGroupType(g.creator_type || "");
                      setGroupCreators(g.creators?.join(", ") || "");
                      setGroupCount(g.count);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 text-xs"
                    onClick={() => handleRemoveGroup(activeDay, g.name)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {g.content && (
                <div className="flex flex-wrap gap-1">
                  {g.content.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c.content_category}/{c.content_type}
                    </Badge>
                  ))}
                </div>
              )}
              {g.creators && g.creators.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Creators: {g.creators.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No groups on Day {activeDay}</p>
      )}

      {/* Add group */}
      {!showAddGroup ? (
        <Button size="sm" variant="outline" onClick={() => setShowAddGroup(true)}>
          Add Group
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <span className="text-sm font-medium">
              {currentDay?.groups.some((g) => g.name === groupName) ? "Edit" : "Add"} Group on Day {activeDay}
            </span>

            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-10"
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupRest}
                onChange={(e) => setGroupRest(e.target.checked)}
              />
              Force rest day
            </label>

            {!groupRest && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Content items:</span>
                {groupContent.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="content_category"
                      value={c.content_category}
                      onChange={(e) => {
                        const updated = [...groupContent];
                        updated[i] = { ...updated[i], content_category: e.target.value };
                        setGroupContent(updated);
                      }}
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="content_type"
                      value={c.content_type}
                      onChange={(e) => {
                        const updated = [...groupContent];
                        updated[i] = { ...updated[i], content_type: e.target.value };
                        setGroupContent(updated);
                      }}
                      className="h-9 text-sm"
                    />
                    {groupContent.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs shrink-0"
                        onClick={() => setGroupContent(groupContent.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setGroupContent([...groupContent, { content_category: "", content_type: "" }])}
                >
                  + Content Item
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Region</label>
                <Input
                  placeholder="e.g. EST"
                  value={groupRegion}
                  onChange={(e) => setGroupRegion(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Creator type</label>
                <Input
                  placeholder="e.g. ugc"
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Specific creators (comma-separated)</label>
                <Input
                  placeholder="alice, bob"
                  value={groupCreators}
                  onChange={(e) => setGroupCreators(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Count</label>
                <Input
                  type="number"
                  min={1}
                  value={groupCount ?? ""}
                  onChange={(e) => setGroupCount(e.target.value ? Number(e.target.value) : undefined)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" disabled={saving || !groupName.trim()} onClick={handleAddGroup}>
                {saving ? "Saving..." : "Add Group"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetGroupForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
