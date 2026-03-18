import Link from "next/link";
import { CampaignNav } from "@/components/layout/CampaignNav";
import { ArrowLeft } from "lucide-react";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaign: string }>;
}) {
  const { campaign } = await params;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Link href="/" className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">{campaign}</h1>
      </div>
      <CampaignNav campaign={campaign} />
      <div className="p-4">{children}</div>
    </div>
  );
}
