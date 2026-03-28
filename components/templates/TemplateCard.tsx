"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TemplateListItem } from "@/lib/types";
import { Image, Film, Presentation } from "lucide-react";

const categoryConfig: Record<string, { label: string; color: string; icon: typeof Image }> = {
  faceless_slideshow: { label: "Faceless Slideshow", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", icon: Presentation },
  ugc_slideshow: { label: "UGC Slideshow", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", icon: Image },
  ugc_video: { label: "UGC Video", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", icon: Film },
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function TemplateCard({ template, campaign }: { template: TemplateListItem; campaign: string }) {
  const cat = categoryConfig[template.category] || categoryConfig.faceless_slideshow;
  const Icon = cat.icon;

  return (
    <Link href={`/${campaign}/templates/${template.category}/${template.name}`}>
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{template.name}</span>
            </div>
            <Badge variant="outline" className={statusColors[template.status]}>
              {template.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={cat.color}>
              {cat.label}
            </Badge>
            {template.slide_count != null && (
              <span className="text-xs text-muted-foreground">{template.slide_count} slides</span>
            )}
            {template.reaction_duration != null && (
              <span className="text-xs text-muted-foreground">{template.reaction_duration}s reaction</span>
            )}
            {template.clip != null && (
              <span className="text-xs text-muted-foreground">clip: {template.clip}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
