import { redirect } from "next/navigation";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ campaign: string }>;
}) {
  const { campaign } = await params;
  // Default to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];
  redirect(`/${campaign}/plan/${dateStr}`);
}
