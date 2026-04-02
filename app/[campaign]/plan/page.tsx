import { redirect } from "next/navigation";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ campaign: string }>;
}) {
  const { campaign } = await params;
  redirect(`/${campaign}/plans`);
}
