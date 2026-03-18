import { Badge } from "@/components/ui/badge";
import type { CycleStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  none: { label: "No Cycle", className: "bg-gray-100 text-gray-700" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800" },
  auto_confirmed: { label: "Auto-confirmed", className: "bg-blue-100 text-blue-800" },
  generating: { label: "Generating", className: "bg-blue-100 text-blue-800 animate-pulse" },
  complete: { label: "Complete", className: "bg-green-100 text-green-800" },
  complete_with_failures: { label: "Partial", className: "bg-orange-100 text-orange-800" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: CycleStatus }) {
  const config = statusConfig[status] || statusConfig.none;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
