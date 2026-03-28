"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, Loader2 } from "lucide-react";

interface ActivateBarProps {
  ready: boolean;
  missing: string[];
  loading: boolean;
  onActivate: () => void;
}

export function ActivateBar({ ready, missing, loading, onActivate }: ActivateBarProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                className="w-full min-h-[44px]"
                disabled={!ready || loading}
                onClick={onActivate}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="size-4 mr-2" />
                )}
                {loading ? "Activating..." : "Activate Template"}
              </Button>
            </div>
          </TooltipTrigger>
          {!ready && (
            <TooltipContent side="top" className="max-w-xs">
              <p className="font-medium">Missing assets:</p>
              <ul className="text-xs mt-1">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
