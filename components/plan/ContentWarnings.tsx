import { Badge } from "@/components/ui/badge";
import type { ContentLevels } from "@/lib/types";

export function ContentWarnings({ levels }: { levels: ContentLevels | null }) {
  if (!levels || levels.total_issues === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold">Content Warnings</h2>

      {levels.exhausted.length > 0 && (
        <div className="space-y-1">
          {levels.exhausted.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm"
            >
              <Badge className="bg-red-500 text-white shrink-0">0</Badge>
              <span className="truncate">
                {e.creator} — {e.text_type}
              </span>
            </div>
          ))}
        </div>
      )}

      {levels.low.length > 0 && (
        <div className="space-y-1">
          {levels.low.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-sm"
            >
              <Badge className="bg-yellow-500 text-white shrink-0">
                {e.remaining}
              </Badge>
              <span className="truncate">
                {e.creator} — {e.text_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
