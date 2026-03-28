"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { TemplateDetail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ValidationBanner } from "@/components/templates/ValidationBanner";
import { ActivateBar } from "@/components/templates/ActivateBar";
import { SlideCarousel } from "@/components/templates/SlideCarousel";
import { VideoConfigEditor } from "@/components/templates/VideoConfigEditor";
import { ClipRequirements } from "@/components/templates/ClipRequirements";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const categoryLabels: Record<string, string> = {
  faceless_slideshow: "Faceless Slideshow",
  ugc_slideshow: "UGC Slideshow",
  ugc_video: "UGC Video",
};

export default function TemplateDetailPage() {
  const { campaign, category, template_name } = useParams<{
    campaign: string;
    category: string;
    template_name: string;
  }>();
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const loadTemplate = useCallback(async () => {
    try {
      const res = await api.getTemplateDetail(campaign, category, template_name);
      setTemplate(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [campaign, category, template_name]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  async function handleActivate() {
    setActivating(true);
    try {
      await api.activateTemplate(campaign, category, template_name);
      toast.success("Template activated");
      router.push(`/${campaign}/templates`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setActivating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-40 bg-muted rounded" />
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!template) {
    return <p className="text-sm text-muted-foreground">Template not found</p>;
  }

  const isSlideshow = category === "faceless_slideshow" || category === "ugc_slideshow";
  const isVideo = category === "ugc_video";

  return (
    <div className="space-y-4 pb-20">
      {/* Back link */}
      <Link
        href={`/${campaign}/templates`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
      >
        <ArrowLeft className="size-4" />
        Templates
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{template.name}</h2>
          <span className="text-sm text-muted-foreground">{categoryLabels[category]}</span>
        </div>
        <Badge variant="outline" className={statusColors[template.status]}>
          {template.status}
        </Badge>
      </div>

      {/* Validation banner */}
      {!template.validation.ready && (
        <ValidationBanner missing={template.validation.missing} />
      )}

      {/* Slideshow content */}
      {isSlideshow && template.slides && (
        <SlideCarousel
          slides={template.slides}
          campaign={campaign}
          category={category}
          templateName={template_name}
          onUploaded={loadTemplate}
        />
      )}

      {/* UGC Video content */}
      {isVideo && (
        <>
          {/* Thumbnail */}
          {template.has_thumbnail && template.thumbnail_url && (
            <Card>
              <CardContent className="p-3">
                <h3 className="text-xs text-muted-foreground mb-2">Thumbnail</h3>
                <img
                  src={template.thumbnail_url}
                  alt="Template thumbnail"
                  className="w-full rounded-md object-cover max-h-48"
                />
              </CardContent>
            </Card>
          )}

          {/* Config editor */}
          {template.config && (
            <VideoConfigEditor
              campaign={campaign}
              templateName={template_name}
              config={template.config}
              onUpdated={loadTemplate}
            />
          )}

          {/* Clip requirements */}
          {template.clip_requirements && template.clip_requirements.type !== "none" && (
            <ClipRequirements
              requirements={template.clip_requirements}
              clips={template.clips || []}
              campaign={campaign}
              templateName={template_name}
              onUploaded={loadTemplate}
            />
          )}
        </>
      )}

      {/* Caption */}
      {template.caption && (
        <Card>
          <CardContent className="p-3">
            <h3 className="text-xs text-muted-foreground mb-1">Caption</h3>
            <p className="text-sm">{template.caption}</p>
          </CardContent>
        </Card>
      )}

      {/* Writing guide */}
      {template.writing_guide && (
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full min-h-[44px] text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className={`size-4 transition-transform ${guideOpen ? "rotate-180" : ""}`} />
            Writing Guide
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="p-3">
                <pre className="text-xs whitespace-pre-wrap">{template.writing_guide}</pre>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Activate bar */}
      {template.status === "pending" && (
        <ActivateBar
          ready={template.validation.ready}
          missing={template.validation.missing}
          loading={activating}
          onActivate={handleActivate}
        />
      )}
    </div>
  );
}
