import { describe, expect, it } from "vitest";
import { initialLocationDraft, initialReportDraft } from "@/features/shared/mock-app-state";
import { buildReportSubmissionPayload } from "../report-payload";

describe("report submission boundary", () => {
  it("converts display values to the documented camelCase API payload", () => {
    const report = {
      ...initialReportDraft,
      threatCategoryCode: "ghost_gear" as const,
      threatCategoryId: 1,
      observationDate: "27/08/2026",
      observationTime: "09:10",
      estimatedDepthMetres: "12.5",
      description: "  Net tangled around coral.  ",
    };
    const location = {
      ...initialLocationDraft,
      confidence: "within_100m" as const,
      selectedSessionId: "session-4",
      sessions: [
        {
          id: "session-4",
          backendId: 4,
          namedDiveSiteId: 13,
          site: "Temple of the Sea",
        },
      ],
      pin: { x: 50, y: 50, latitude: 5.123456, longitude: 103.123456 },
    };

    const result = buildReportSubmissionPayload(report, location);
    expect(result).toMatchObject({
      threatCategoryId: 1,
      estimatedDepthMetres: 12.5,
      description: "Net tangled around coral.",
      diveSessionId: 4,
      location: {
        namedDiveSiteId: 13,
        locationConfidence: "within_100m",
        mapPin: { latitude: 5.123456, longitude: 103.123456 },
      },
    });
    expect(result.observedAt).toBe(new Date("2026-08-27T09:10:00").toISOString());
  });

  it.each([
    ["ghost_gear", 41],
    ["coral_bleaching", 42],
    ["marine_debris", 43],
    ["physical_reef_damage", 44],
    ["unsure", 45],
  ] as const)("preserves the backend category id for %s", (threatCategoryCode, threatCategoryId) => {
    const result = buildReportSubmissionPayload(
      {
        ...initialReportDraft,
        threatCategoryCode,
        threatCategoryId,
        observationDate: "05/09/2026",
        observationTime: "10:15",
        description: "Observed reef condition.",
      },
      {
        ...initialLocationDraft,
        confidence: "dive_site_only",
        selectedSessionId: "session-1",
        sessions: [{
          id: "session-1",
          backendId: 91,
          namedDiveSiteId: 7,
          site: "Shark Point — Perhentian Islands",
        }],
      },
    );

    expect(result.threatCategoryId).toBe(threatCategoryId);
  });
});
