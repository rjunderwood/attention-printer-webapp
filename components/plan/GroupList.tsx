"use client";

import { Button } from "@/components/ui/button";
import { GroupCard } from "./GroupCard";
import type { PlanGroup, CampaignConfig } from "@/lib/types";
import { Plus, RotateCcw } from "lucide-react";

interface GroupListProps {
  groups: PlanGroup[];
  config: CampaignConfig;
  onUpdateGroup: (group: PlanGroup) => void;
  onRemoveGroup: (name: string) => void;
  onAddGroup: () => void;
  onReset: () => void;
  disabled?: boolean;
  readiness?: Record<string, { ready: number; total: number }>;
}

export function GroupList({
  groups,
  config,
  onUpdateGroup,
  onRemoveGroup,
  onAddGroup,
  onReset,
  disabled,
  readiness,
}: GroupListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Plan Groups</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {groups.map((group) => (
        <GroupCard
          key={group.name}
          group={group}
          config={config}
          onUpdate={onUpdateGroup}
          onRemove={() => onRemoveGroup(group.name)}
          disabled={disabled}
          readiness={readiness?.[group.name]}
        />
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={onAddGroup}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Group
      </Button>
    </div>
  );
}
