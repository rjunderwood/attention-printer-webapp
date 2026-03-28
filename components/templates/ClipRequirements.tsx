"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { ClipUpload } from "./ClipUpload";
import type { ClipRequirements as ClipReqType, TemplateClip } from "@/lib/types";

interface ClipRequirementsProps {
  requirements: ClipReqType;
  clips: TemplateClip[];
  campaign: string;
  templateName: string;
  onUploaded: () => void;
}

function ClipItem({
  filename,
  present,
  clipUrl,
  campaign,
  templateName,
  onUploaded,
}: {
  filename: string;
  present: boolean;
  clipUrl: string | undefined;
  campaign: string;
  templateName: string;
  onUploaded: () => void;
}) {
  const [replacing, setReplacing] = useState(false);

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-mono">{filename}</span>
          <div className="flex items-center gap-2">
            {present && !replacing && (
              <Button
                variant="outline"
                size="xs"
                className="min-h-[32px]"
                onClick={() => setReplacing(true)}
              >
                <RefreshCw className="size-3 mr-1" />
                Replace
              </Button>
            )}
            {present ? (
              <CheckCircle className="size-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="size-4 text-red-500 shrink-0" />
            )}
          </div>
        </div>
        {replacing ? (
          <div className="space-y-2">
            <ClipUpload
              campaign={campaign}
              templateName={templateName}
              filename={filename}
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
        ) : present && clipUrl ? (
          <video
            src={clipUrl}
            controls
            className="w-full rounded-md max-h-48"
          />
        ) : !present ? (
          <ClipUpload
            campaign={campaign}
            templateName={templateName}
            filename={filename}
            onUploaded={onUploaded}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ClipRequirements({ requirements, clips, campaign, templateName, onUploaded }: ClipRequirementsProps) {
  if (requirements.type === "none") return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Required Clips ({requirements.type})
      </h3>
      {requirements.status?.map((item) => {
        const clipUrl = clips.find((c) => c.filename === item.filename)?.url;
        return (
          <ClipItem
            key={item.filename}
            filename={item.filename}
            present={item.present}
            clipUrl={clipUrl}
            campaign={campaign}
            templateName={templateName}
            onUploaded={onUploaded}
          />
        );
      })}
    </div>
  );
}
