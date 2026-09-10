import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { GuidanceContent } from "@/features/epic-02-reporting/guidance-content";
import type { ThreatCategoryCode } from "@/features/epic-02-reporting/types";

export const metadata: Metadata = { title: "Responsible reporting" };

const guidanceThreats = new Set<ThreatCategoryCode>(["ghost_gear", "coral_bleaching", "marine_debris", "physical_reef_damage"]);

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ threat?: string | string[] }> }) {
  const threatValue = (await searchParams).threat;
  const threat = typeof threatValue === "string" && guidanceThreats.has(threatValue as ThreatCategoryCode)
    ? threatValue as ThreatCategoryCode
    : undefined;
  return (
    <PageTemplate
      eyebrow="Responsible reporting"
      title="What can I safely report?"
      description="Learn which reef threats ReefCare MY supports, what evidence is useful and how to observe without putting yourself or the reef at risk."
    >
      <GuidanceContent initialThreat={threat} />
    </PageTemplate>
  );
}
