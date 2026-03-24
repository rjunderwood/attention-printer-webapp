"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Overview", path: "" },
  { label: "Plan", path: "/plan" },
  { label: "Creators", path: "/creators" },
  { label: "History", path: "/history" },
  { label: "Content", path: "/content" },
  { label: "Capacity", path: "/capacity" },
  { label: "Failures", path: "/failures" },
];

export function CampaignNav({ campaign }: { campaign: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b px-4 pb-0">
      {tabs.map((tab) => {
        const href = `/${campaign}${tab.path}`;
        const isActive =
          tab.path === ""
            ? pathname === `/${campaign}`
            : pathname.startsWith(href);
        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              "whitespace-nowrap px-3 py-2 text-sm border-b-2 -mb-[1px] min-h-[44px] flex items-center",
              isActive
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
