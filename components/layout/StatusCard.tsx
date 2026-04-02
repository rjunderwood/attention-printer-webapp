"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/plan/StatusBadge";
import { Button } from "@/components/ui/button";
import type { PlanNewShowResponse } from "@/lib/types";

interface StatusCardProps {
  show: PlanNewShowResponse;
  onConfirm?: () => void;
  loading?: boolean;
}

export function StatusCard({ show, onConfirm, loading }: StatusCardProps) {
  if (!show.active) {
    return (
      <Card>
        <CardContent className="p-4">
          <span className="text-sm text-muted-foreground">No plan template active</span>
        </CardContent>
      </Card>
    );
  }

  const confirmation = show.confirmation;

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {confirmation && <StatusBadge status={confirmation.status} />}
            {confirmation?.target_date && (
              <span className="text-sm text-muted-foreground">
                {confirmation.target_date}
              </span>
            )}
          </div>
          {show.cycle_day != null && show.cycle_days != null && (
            <p className="text-sm text-muted-foreground">
              {show.template_name} · Day {show.cycle_day}/{show.cycle_days}
              {show.cycle_count != null && ` · Cycle ${show.cycle_count}`}
            </p>
          )}
        </div>
        {confirmation?.status === "pending" && onConfirm && (
          <Button
            onClick={onConfirm}
            disabled={loading}
            size="sm"
            className="min-h-[44px]"
          >
            {loading ? "..." : "Confirm"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
