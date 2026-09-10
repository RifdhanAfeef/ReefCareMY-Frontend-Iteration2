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
};

export type ReportDraft = {
  threatCategoryCode: ThreatCategoryCode | "";
  threatCategoryId: number | null;
  observationDate: string;
  observationTime: string;
  estimatedDepthMetres: string;
  description: string;
  photos: ReportPhotoMetadata[];
  lastSavedAt: string | null;
};
