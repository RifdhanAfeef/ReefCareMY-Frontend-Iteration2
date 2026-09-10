import { apiRequest } from "./client";
import type {
  DiveSiteReference,
  ThreatCategoryCode,
  ThreatCategoryReference,
} from "./types";

type RawThreatCategory = Partial<ThreatCategoryReference> & {
  threat_category_id?: number;
  short_explanation?: string;
  useful_evidence?: string;
  safety_reminder?: string;
  icon_reference?: string | null;
};

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`ReefCare MY returned an invalid ${field} value. Please try again.`);
  }
  return value;
}

function normaliseThreatCategory(item: RawThreatCategory): ThreatCategoryReference {
  const threatCategoryId = item.threatCategoryId ?? item.threat_category_id;
  if (!Number.isInteger(threatCategoryId) || Number(threatCategoryId) <= 0) {
    throw new Error("ReefCare MY returned an invalid threat category. Please try again.");
  }

  return {
    threatCategoryId: Number(threatCategoryId),
    code: requiredString(item.code, "threat category code") as ThreatCategoryCode,
    label: requiredString(item.label, "threat category label"),
    shortExplanation: requiredString(
      item.shortExplanation ?? item.short_explanation,
      "threat category explanation",
    ),
    usefulEvidence: requiredString(
      item.usefulEvidence ?? item.useful_evidence,
      "useful evidence",
    ),
    safetyReminder: requiredString(
      item.safetyReminder ?? item.safety_reminder,
      "safety reminder",
    ),
    iconReference: item.iconReference ?? item.icon_reference ?? null,
  };
}

export async function getThreatCategories(): Promise<ThreatCategoryReference[]> {
  const result = await apiRequest<RawThreatCategory[]>({
    path: "/api/v1/reference/threat-categories",
    auth: false,
  });
  return result.map(normaliseThreatCategory);
}

export async function getDiveSites(): Promise<DiveSiteReference[]> {
  return apiRequest<DiveSiteReference[]>({ path: "/api/v1/reference/dive-sites" });
}
