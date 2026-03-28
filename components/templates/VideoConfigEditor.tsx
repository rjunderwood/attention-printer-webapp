"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { VideoConfig } from "@/lib/types";

interface VideoConfigEditorProps {
  campaign: string;
  templateName: string;
  config: VideoConfig;
  onUpdated: () => void;
}

export function VideoConfigEditor({ campaign, templateName, config, onUpdated }: VideoConfigEditorProps) {
  const [reactionDuration, setReactionDuration] = useState(config.reaction_duration ?? 4);
  const [clip, setClip] = useState(config.clip ?? "none");
  const [textPosition, setTextPosition] = useState(config.text?.position ?? "center");
  const [textDuration, setTextDuration] = useState<string>(String(config.text?.duration ?? "all"));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const duration = textDuration === "all" ? "all" : parseFloat(textDuration);
      await api.updateTemplateConfig(campaign, "ugc_video", templateName, {
        reaction_duration: reactionDuration,
        clip,
        text: { position: textPosition, duration },
      });
      toast.success("Config updated");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Config</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Reaction Duration (s)</label>
          <Input
            type="number"
            min={1}
            value={reactionDuration}
            onChange={(e) => setReactionDuration(parseInt(e.target.value) || 1)}
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Clip Type</label>
          <select
            className="flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm"
            value={clip}
            onChange={(e) => setClip(e.target.value)}
          >
            <option value="none">none</option>
            <option value="fixed">fixed</option>
            <option value="creator">creator</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Text Position</label>
          <select
            className="flex h-8 w-full rounded-lg border bg-transparent px-3 py-1 text-sm"
            value={textPosition}
            onChange={(e) => setTextPosition(e.target.value)}
          >
            <option value="center">center</option>
            <option value="top">top</option>
            <option value="bottom">bottom</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Text Duration</label>
          <Input
            value={textDuration}
            onChange={(e) => setTextDuration(e.target.value)}
            placeholder="all or seconds"
          />
        </div>

        <Button
          className="w-full min-h-[44px]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          {saving ? "Saving..." : "Save Config"}
        </Button>
      </CardContent>
    </Card>
  );
}
