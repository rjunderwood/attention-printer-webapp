"use client";

import { useState, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface SlideUploadProps {
  campaign: string;
  category: string;
  templateName: string;
  slideNum: number;
  onUploaded: () => void;
}

export function SlideUpload({ campaign, category, templateName, slideNum, onUploaded }: SlideUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      await api.uploadFixedImage(campaign, category, templateName, slideNum, file);
      toast.success(`Uploaded image for slide ${slideNum}`);
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [campaign, category, templateName, slideNum, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <label
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors min-h-[100px] ${
        dragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="size-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Upload fixed image</span>
        </>
      )}
      <input
        type="file"
        accept="image/*"
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
