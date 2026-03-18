"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/plan/StatusBadge";
import { Button } from "@/components/ui/button";
import type { PlanStatus } from "@/lib/types";

interface StatusCardProps {
  status: PlanStatus;
  onConfirm?: () => void;
  loading?: boolean;
}

export function StatusCard({ status, onConfirm, loading }: StatusCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={status.status} />
            {status.target_date && (
              <span className="text-sm text-muted-foreground">
                {status.target_date}
              </span>
            )}
          </div>
          {status.creators_posting != null && (
            <p className="text-sm text-muted-foreground">
              {status.creators_posting} posting · {status.creators_resting} resting · {status.creators_paused} paused
            </p>
          )}
        </div>
        {status.status === "pending" && onConfirm && (
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
