import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { ReportDetail } from "@/features/epic-06-feedback/report-detail";
import { ReportTimeline } from "@/features/epic-06-feedback/report-timeline";

export const metadata: Metadata = { title: "Report status" };

export default async function ObserverReportDetailsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <PageTemplate
      eyebrow={`Report ${reportId}`}
      title="Report status"
      description="Show the observer-facing status history, explanations and any request for more information."
    >
      <ReportDetail reportReference={reportId} />
      <ReportTimeline reportReference={reportId} />
    </PageTemplate>
  );
}
