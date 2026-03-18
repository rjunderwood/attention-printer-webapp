"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { CycleStatus } from "@/lib/types";

interface ConfirmBarProps {
  status: CycleStatus;
  planModified: boolean;
  countdown: string | null;
  onConfirm: () => void;
  loading: boolean;
}

export function ConfirmBar({
  status,
  planModified,
  countdown,
  onConfirm,
  loading,
}: ConfirmBarProps) {
  const isPending = status === "pending";

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <StatusBadge status={status} />
          {countdown && isPending && (
            <span className="text-xs text-muted-foreground truncate">
              {countdown}
            </span>
          )}
        </div>
        {isPending ? (
          <Button
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] px-6 shrink-0"
          >
            {loading
              ? "Confirming..."
              : planModified
                ? "Confirm with Refresh"
                : "Confirm Plan"}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {status === "confirmed" || status === "auto_confirmed"
              ? "Confirmed"
              : status === "generating"
                ? "Generating..."
                : status === "complete"
                  ? "Complete"
                  : status === "complete_with_failures"
                    ? "Complete with failures"
                    : status === "failed"
                      ? "Failed"
                      : ""}
          </span>
        )}
      </div>
    </div>
  );
}
