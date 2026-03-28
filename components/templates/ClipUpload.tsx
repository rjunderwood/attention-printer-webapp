"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ClipUploadProps {
  campaign: string;
  templateName: string;
  filename: string;
  onUploaded: () => void;
}

export function ClipUpload({ campaign, templateName, filename, onUploaded }: ClipUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      await api.uploadClip(campaign, templateName, file, filename);
      toast.success(`Uploaded ${filename}`);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [campaign, templateName, filename, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <label
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors ${
        dragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Upload {filename}</span>
        </>
      )}
      <input
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={uploading}
      />
    </label>
  );
}
