"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { TemplateListItem, TemplateCategory } from "@/lib/types";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

type StatusFilter = "pending" | "active" | "all";
type CategoryFilter = "all" | TemplateCategory;

export default function TemplatesPage() {
  const { campaign } = useParams<{ campaign: string }>();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const category = categoryFilter === "all" ? undefined : categoryFilter;
        const res = await api.getTemplates(campaign, status, category);
        setTemplates(res.templates);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaign, statusFilter, categoryFilter]);

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: "Pending", value: "pending" },
    { label: "Active", value: "active" },
    { label: "All", value: "all" },
  ];

  const categoryChips: { label: string; value: CategoryFilter }[] = [
    { label: "All", value: "all" },
    { label: "Faceless Slideshow", value: "faceless_slideshow" },
    { label: "UGC Slideshow", value: "ugc_slideshow" },
    { label: "UGC Video", value: "ugc_video" },
  ];

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, search]);

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1 border-b pb-0">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-2 text-sm border-b-2 -mb-[1px] min-h-[44px] ${
              statusFilter === tab.value
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap">
        {categoryChips.map((chip) => (
          <button key={chip.value} onClick={() => setCategoryFilter(chip.value)}>
            <Badge
              variant={categoryFilter === chip.value ? "default" : "outline"}
              className="cursor-pointer min-h-[32px] px-3"
            >
              {chip.label}
            </Badge>
          </button>
        ))}
      </div>

      {/* Template list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No {statusFilter === "all" ? "" : statusFilter} templates found{search ? ` matching "${search}"` : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <TemplateCard key={`${t.category}/${t.name}`} template={t} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
