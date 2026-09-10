import type { LocationDraft } from "@/features/shared/mock-app-state";
import type { ReportSubmissionPayload } from "@/lib/api/types";
import { displayDateAndTimeToIso } from "@/lib/format/date";
import type { ReportDraft } from "./types";

export function buildReportSubmissionPayload(
  report: ReportDraft,
  location: LocationDraft,
): ReportSubmissionPayload {
  const session = location.sessions.find((item) => item.id === location.selectedSessionId);

  if (!Number.isInteger(report.threatCategoryId) || Number(report.threatCategoryId) <= 0 || !session?.backendId || !location.confidence) {
    throw new Error("The report needs a Dive Session, threat category and location confidence.");
  }

  const payload: ReportSubmissionPayload = {
    threatCategoryId: Number(report.threatCategoryId),
    observedAt: displayDateAndTimeToIso(report.observationDate, report.observationTime),
    description: report.description.trim(),
    diveSessionId: session.backendId,
    location: {
      namedDiveSiteId: session.namedDiveSiteId,
      locationConfidence: location.confidence,
      mapPin: location.pin
        ? { latitude: location.pin.latitude, longitude: location.pin.longitude }
        : null,
    },
  };

  if (report.estimatedDepthMetres) {
    payload.estimatedDepthMetres = Number(report.estimatedDepthMetres);
  }

  return payload;
}
