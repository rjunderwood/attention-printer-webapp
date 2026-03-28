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
  readiness?: { ready: number; total: number };
}

export function GroupCard({ group, config, onUpdate, onRemove, disabled, readiness }: GroupCardProps) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{group.name}</span>
          {readiness && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  readiness.ready === readiness.total
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              {readiness.ready}/{readiness.total} ready
            </span>
          )}
        </div>
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

      <div>
        <label className="text-xs text-muted-foreground">
          Content Types ({group.content_types.length} post{group.content_types.length !== 1 ? "s" : ""}/day)
        </label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {group.content_types.map((ct, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-md border bg-accent/50 px-2 py-1 text-sm"
            >
              {ct}
              <button
                type="button"
                className="ml-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => {
                  const next = group.content_types.filter((_, i) => i !== idx);
                  onUpdate({ ...group, content_types: next });
                }}
                disabled={disabled || group.content_types.length <= 1}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value=""
            onChange={(e) => {
              if (e.target.value) {
                onUpdate({ ...group, content_types: [...group.content_types, e.target.value] });
                e.target.value = "";
              }
            }}
            disabled={disabled}
          >
            <option value="">+ Add...</option>
            {config.content_types.map((ct) => (
              <option key={ct} value={ct}>
                {ct}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
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

        {config.creator_types?.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground">Creator Type</label>
            <select
              className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
              value={group.type || "all"}
              onChange={(e) => {
                const val = e.target.value === "all" ? undefined : e.target.value;
                onUpdate({ ...group, type: val });
              }}
              disabled={disabled}
            >
              <option value="all">All</option>
              {config.creator_types.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}

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
    </div>
  );
}
