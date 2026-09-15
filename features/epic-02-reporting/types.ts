export type ThreatCategoryCode =
  | "ghost_gear"
  | "coral_bleaching"
  | "marine_debris"
  | "physical_reef_damage"
  | "unsure";

export type ReportPhotoMetadata = {
  id: string;
  name: string;
  type: string;
  size: number;
  capturedAt?: string | null;
  capturedAtConfirmed?: boolean;
};

export type ReportAISuggestion = {
  field: string;
  label: string;
  suggestedValue: string | null;
  status: "unresolved" | "confirmed" | "corrected" | "removed";
};

export type ReportDraft = {
  threatCategoryCode: ThreatCategoryCode | "";
  threatCategoryId: number | null;
  observationDate: string;
  observationTime: string;
  estimatedDepthMetres: string;
  description: string;
  photos: ReportPhotoMetadata[];
  aiSuggestions: ReportAISuggestion[];
  lastSavedAt: string | null;
};
