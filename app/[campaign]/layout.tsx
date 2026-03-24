export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaign: string }>;
}) {
  const { campaign } = await params;
  return (
    <div>
      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
        <h1 className="text-lg font-semibold">{campaign}</h1>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}
