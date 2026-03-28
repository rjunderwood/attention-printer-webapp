"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SlideUpload } from "./SlideUpload";
import { RefreshCw } from "lucide-react";
import type { Slide } from "@/lib/types";

const imageTypeBadge: Record<string, string> = {
  generated_prompt: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ugc_creator: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  fixed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

interface SlideCarouselProps {
  slides: Slide[];
  campaign: string;
  category: string;
  templateName: string;
  onUploaded: () => void;
}

function formatSlideText(text: string) {
  return text.replace(/\{lg\}/g, "\n");
}

function FixedImageWithReplace({
  imageUrl,
  slideNum,
  campaign,
  category,
  templateName,
  onUploaded,
}: {
  imageUrl: string;
  slideNum: number;
  campaign: string;
  category: string;
  templateName: string;
  onUploaded: () => void;
}) {
  const [replacing, setReplacing] = useState(false);

  if (replacing) {
    return (
      <div className="space-y-2">
        <SlideUpload
          campaign={campaign}
          category={category}
          templateName={templateName}
          slideNum={slideNum}
          onUploaded={() => {
            setReplacing(false);
            onUploaded();
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="w-full min-h-[44px]"
          onClick={() => setReplacing(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <img
        src={imageUrl}
        alt={`Slide ${slideNum} fixed`}
        className="w-full rounded-md object-cover max-h-48"
      />
      <Button
        variant="outline"
        size="sm"
        className="w-full min-h-[44px]"
        onClick={() => setReplacing(true)}
      >
        <RefreshCw className="size-3 mr-1" />
        Replace
      </Button>
    </div>
  );
}

export function SlideCarousel({ slides, campaign, category, templateName, onUploaded }: SlideCarouselProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Slides ({slides.length})
      </h3>
      {slides.map((slide) => (
        <Card key={slide.slide_number}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Slide {slide.slide_number}</span>
              <Badge variant="outline" className={imageTypeBadge[slide.image.type] || ""}>
                {slide.image.type.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Reference image */}
            {slide.image.has_reference_image && slide.image.reference_image_url && (
              <div className="mb-2">
                <img
                  src={slide.image.reference_image_url}
                  alt={`Slide ${slide.slide_number} reference`}
                  className="w-full rounded-md object-cover max-h-48"
                />
              </div>
            )}

            {/* Fixed image or upload */}
            {slide.image.type === "fixed" && (
              <div className="mb-2">
                {slide.image.has_fixed_image && slide.image.fixed_image_url ? (
                  <FixedImageWithReplace
                    imageUrl={slide.image.fixed_image_url}
                    slideNum={slide.slide_number}
                    campaign={campaign}
                    category={category}
                    templateName={templateName}
                    onUploaded={onUploaded}
                  />
                ) : (
                  <SlideUpload
                    campaign={campaign}
                    category={category}
                    templateName={templateName}
                    slideNum={slide.slide_number}
                    onUploaded={onUploaded}
                  />
                )}
              </div>
            )}

            {/* Text preview */}
            {slide.text?.text && (
              <div className="rounded-md bg-muted p-2">
                <p className="text-xs whitespace-pre-line">{formatSlideText(slide.text.text)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
