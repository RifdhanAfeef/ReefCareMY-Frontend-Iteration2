import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { ObservationForm } from "@/features/epic-02-reporting/observation-form";

export const metadata: Metadata = { title: "Report a reef" };

const supportedThreats = new Set([
  "ghost_gear",
  "coral_bleaching",
  "marine_debris",
  "physical_reef_damage",
]);

export default async function ReportAReefPage({
  searchParams,
}: {
  searchParams: Promise<{ threat?: string | string[] }>;
}) {
  const threatValue = (await searchParams).threat;
  const initialThreat = typeof threatValue === "string" && supportedThreats.has(threatValue)
    ? threatValue
    : undefined;

  return (
    <PageTemplate
      eyebrow="New observation"
      title="Tell us what you observed"
      description="Capture the reef threat, date, evidence and a short description without requiring scientific training."
      showBackButton
      backLabel="Back to reef threats"
      backFallbackHref="/reef-threats"
    >
      <ObservationForm initialThreat={initialThreat} />
    </PageTemplate>
  );
}
