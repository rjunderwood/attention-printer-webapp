"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanGroup, CampaignConfig } from "@/lib/types";
import { X } from "lucide-react";

interface GroupCardProps {
  group: PlanGroup;
  config: CampaignConfig;
  onUpdate: (group: PlanGroup) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function GroupCard({ group, config, onUpdate, onRemove, disabled }: GroupCardProps) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{group.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Content Type</label>
          <select
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            value={group.content_type ?? "rotation"}
            onChange={(e) => {
              const val = e.target.value === "rotation" ? null : e.target.value;
              onUpdate({ ...group, content_type: val });
            }}
            disabled={disabled}
          >
            <option value="rotation">Rotation</option>
            {config.content_types.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Region</label>
          <select
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
            value={group.region || "all"}
            onChange={(e) => {
              const val = e.target.value === "all" ? undefined : e.target.value;
              onUpdate({ ...group, region: val });
            }}
            disabled={disabled}
          >
            <option value="all">All</option>
            {config.regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Count (optional)</label>
        <Input
          type="number"
          min={1}
          placeholder="All"
          value={group.count ?? ""}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value) : undefined;
            onUpdate({ ...group, count: val });
          }}
          disabled={disabled}
          className="h-11"
        />
      </div>
    </div>
  );
}
