export type UserRole = "observer" | "case_coordinator" | "system_administrator";

export type AuthUser = {
  id: number;
  displayName: string;
  role: UserRole;
};

export type AuthResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  displayName: string;
  password: string;
};

export type RegisteredUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
};

export type AdminUserRole = UserRole | "conservation_responder" | "dive_operator";

export type AdminUser = {
  id: number;
  email: string;
  displayName: string;
  role: AdminUserRole;
  isActive: boolean;
  createdAt: string;
};

export type AdminUserListResult = {
  items: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
};

export type AdminUserCreate = {
  email: string;
  displayName: string;
  password: string;
  role?: "observer";
};

export type AdminUserUpdate = {
  displayName?: string;
  isActive?: boolean;
};

export type CoordinatorApprovalResult = Pick<
  AdminUser,
  "id" | "email" | "displayName" | "role" | "isActive"
>;

export type ReportStatusCode =
  | "draft"
  | "submitted"
  | "received"
  | "claimed"
  | "under_review"
  | "needs_more_info"
  | "evidence_accepted"
  | "monitoring"
  | "referred"
  | "closed_no_action"
  | "closed_not_substantiated"
  | "closed_no_partner"
  | "closed_logged";

export type ReportSummary = {
  reportReference: string;
  threatCategory: string;
  generalLocation: string;
  status: ReportStatusCode;
  statusLabel: string;
  outcome: string | null;
  submittedAt: string;
};

export type MyReportsFilters = {
  status?: ReportStatusCode;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

export type MyReportsResult = {
  items: ReportSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export type ReportPreciseLocation = {
  latitude: number | null;
  longitude: number | null;
  uncertaintyMetres: number | null;
  confidenceLabel: string | null;
  sourceLabel: string | null;
  relocationNotes: string | null;
};

export type ReportClosureSummary = {
  status: ReportStatusCode;
  closureLabel: string;
  publicNote: string | null;
};

export type ReportDetail = {
  reportReference: string;
  threatCategory: string;
  description: string;
  observedAt: string;
  estimatedDepthMetres: number | null;
  generalLocation: string;
  diveSite: string | null;
  preciseLocation: ReportPreciseLocation | null;
  status: ReportStatusCode;
  statusLabel: string;
  outcome: string | null;
  informationRequestReason: string | null;
  closure: ReportClosureSummary | null;
  submittedAt: string;
};

export type ObserverInformationRequest = {
  reportReference?: string;
  reason?: string | null;
  requestReason?: string | null;
  requestedAt?: string | null;
};

export type ObserverInformationResponseCreate = {
  text: string;
  evidenceIds: number[];
};

export type ObserverInformationResponseResult = {
  reportReference: string;
  status: "under_review";
  respondedAt: string;
};

export type ReportTimelineEvent = {
  statusLabel: string;
  occurredAt: string;
};

export type ReportTimeline = {
  reportReference: string;
  timeline: ReportTimelineEvent[];
};

export type ReportSubmittedResult = {
  reportReference: string;
  status: string;
  submittedAt: string;
  generalLocation: string;
};

export type ThreatCategoryCode =
  | "ghost_gear"
  | "coral_bleaching"
  | "marine_debris"
  | "physical_reef_damage"
  | "unsure";

export type ThreatCategoryReference = {
  threatCategoryId: number;
  code: ThreatCategoryCode;
  label: string;
  shortExplanation: string;
  usefulEvidence: string;
  safetyReminder: string;
  iconReference: string | null;
};

export type DiveSiteReference = {
  diveSiteId: number;
  name: string;
  publicAreaLabel: string;
  region?: string | null;
};

export type DiveSession = {
  diveSessionId: number;
  label?: string | null;
  diveDate: string;
  namedDiveSite: Omit<DiveSiteReference, "region">;
  approximateStartTime: string | null;
  approximateEndTime: string | null;
};

export type DiveSessionCreate = {
  namedDiveSiteId: number;
  diveDate: string;
  label?: string;
  approximateStartTime?: string;
  approximateEndTime?: string;
};

export type LocationConfidence =
  | "exact"
  | "within_100m"
  | "within_1km"
  | "dive_site_only"
  | "unsure";

export type MapPinInput = {
  latitude: number;
  longitude: number;
};

export type LocationSource =
  | "named_dive_site"
  | "manual_map_pin"
  | "entered_coordinates"
  | "device_metadata"
  | "unknown";

export type EvidenceMetadataInput = {
  capturedAt: string | null;
};

export type AISuggestionStatus = "unresolved" | "confirmed" | "corrected" | "removed";

export type AISuggestionState = {
  field: string;
  suggestedValue: string | null;
  status: AISuggestionStatus;
};

export type ReportCompletenessLocationInput = {
  namedDiveSiteId?: number | null;
  locationConfidence?: LocationConfidence | null;
  locationSource?: LocationSource | null;
  mapPin?: MapPinInput | null;
  coordinates?: MapPinInput | null;
  relocationNotes?: string | null;
};

export type ReportCompletenessRequest = {
  threatCategoryId?: number | null;
  observedAt?: string | null;
  estimatedDepthMetres?: number | null;
  description?: string | null;
  diveSessionId?: number | null;
  location?: ReportCompletenessLocationInput | null;
  evidenceCount: number;
};

export type ReportCompletenessResponse = {
  isSubmittable: boolean;
  blockingMissing: string[];
  blockingIssues: string[];
  recommendedMissing: string[];
  summary: string;
};

export type LocationCheckRequest = {
  namedDiveSiteId: number;
  locationSource: LocationSource;
  mapPin?: MapPinInput | null;
  coordinates?: MapPinInput | null;
};

export type LocationCheckResponse = {
  checkAvailable: boolean;
  hasWarning: boolean;
  warningCode: string | null;
  message: string | null;
  distanceMetres: number | null;
  thresholdMetres: number | null;
  selectedSiteId: number;
  selectedSiteName: string | null;
};

export type ReportReviewRequest = ReportCompletenessRequest & {
  evidenceMetadata: EvidenceMetadataInput[];
  aiSuggestions: AISuggestionState[];
};

export type ReportReviewResponse = {
  isSubmittable: boolean;
  completeness: ReportCompletenessResponse;
  unresolvedSuggestions: AISuggestionState[];
  report: Record<string, unknown>;
  evidence: Array<Record<string, unknown>>;
  locationWarning: LocationCheckResponse | null;
};

export type ReportSubmissionPayload = {
  threatCategoryId: number;
  observedAt: string;
  estimatedDepthMetres?: number;
  description: string;
  diveSessionId: number;
  location: {
    namedDiveSiteId: number;
    locationConfidence: LocationConfidence;
    locationSource: LocationSource;
    mapPin?: MapPinInput | null;
    coordinates?: MapPinInput | null;
    relocationNotes?: string;
  };
  evidenceMetadata: EvidenceMetadataInput[];
  aiSuggestions: AISuggestionState[];
};

export type CoordinatorQueueItem = {
  reportReference: string;
  threat: string;
  area: string | null;
  statusCode: ReportStatusCode;
  statusLabel: string;
  submittedAt: string;
  hoursInQueue: number;
  evidenceCompleteness?: string | null;
  evidenceCount?: number;
  priority?: string | null;
  priorityReasons?: string[];
  owner?: CaseOwner | null;
  claimedAt?: string | null;
};

export type CoordinatorQueueResult = {
  items: CoordinatorQueueItem[];
  page: number;
  pageSize: number;
  total: number;
};

export type CaseOwner = {
  id: number;
  displayName: string;
};

export type ClaimedCase = {
  reportReference: string;
  owner: CaseOwner;
  statusCode: ReportStatusCode;
  statusLabel: string;
  claimedAt: string;
};

export type CoordinatorDecisionSummary = {
  responseType: ResponseType;
  notes?: string | null;
  referredTo?: string | null;
  decidedAt?: string | null;
};

export type CoordinatorTriageContext = {
  evidenceCompleteness?: string | null;
  evidenceCount?: number;
  priority?: string | null;
  priorityReasons?: string[];
  hoursInQueue?: number;
};

export type CoordinatorAiAssisted = {
  available?: boolean;
  generatedAt?: string | null;
  source?: string | null;
  summary?: string | null;
  suggestions?: Record<string, unknown> | Array<Record<string, unknown>> | null;
  warnings?: string[];
};

export type CoordinatorInformationExchange = {
  requestReason?: string | null;
  requestedAt?: string | null;
  responseText?: string | null;
  respondedAt?: string | null;
};

export type CoordinatorCase = {
  reportReference: string;
  observerId: number;
  threat: string;
  description: string;
  observedAt: string | null;
  estimatedDepthMetres: number | null;
  area: string | null;
  preciseLocation: {
    latitude: number | null;
    longitude: number | null;
    uncertaintyMetres: number | null;
    confidenceLabel?: string | null;
    sourceLabel?: string | null;
    relocationNotes?: string | null;
  } | null;
  statusCode: ReportStatusCode;
  statusLabel: string;
  submittedAt: string;
  owner: CaseOwner;
  evidence: CoordinatorEvidence[];
  triageContext?: CoordinatorTriageContext | null;
  aiAssisted?: CoordinatorAiAssisted | null;
  informationExchange?: CoordinatorInformationExchange | null;
  latestDecision?: CoordinatorDecisionSummary | null;
};

export type CoordinatorEvidence = {
  evidenceId: number;
  mediaType: string;
  capturedAt?: string | null;
  uploadedAt: string;
};

export type StartReviewResult = {
  reportReference: string;
  statusCode: "under_review";
};

export type EvidenceAssessmentCreate = {
  evidenceUsable: boolean;
  observationCredible?: boolean;
  notes?: string;
  relatedReportState?: string;
  relatedReportReference?: string;
};

export type EvidenceAssessmentResult = {
  reportReference: string;
  evidenceUsable: boolean;
  observationCredible: boolean | null;
  status: ReportStatusCode;
  assessedAt: string;
  assessedBy: number;
};

export type InformationRequestResult = {
  reportReference: string;
  status: "needs_more_info";
  reason: string;
  requestedAt: string;
};

export type ResponseType =
  | "monitoring_only"
  | "refer_or_share"
  | "intervention_required";

export type CaseDecisionCreate = {
  responseType: ResponseType;
  notes?: string;
  referredTo?: string;
};

export type CaseDecisionResult = {
  reportReference: string;
  responseType: ResponseType;
  decidedAt: string;
  decidedBy: number;
};

export type ClosureReasonCode =
  | "referred_other_org"
  | "monitored_no_action"
  | "not_substantiated"
  | "no_responsible_partner"
  | "logged_for_reference";

export type CaseClosureCreate = {
  closureReasonCode: ClosureReasonCode;
  publicClosureNote: string;
  referredTo?: string;
};

export type CaseClosureResult = {
  reportReference: string;
  status: ReportStatusCode;
  closureReasonCode: ClosureReasonCode;
  closedAt: string;
};

export type ConservationActionState = "action_planned" | "action_taken";

export type ConservationActionTypeOption = {
  code: string;
  label: string;
  description: string | null;
};

export type ConservationActionCreate = {
  actionTypeCode: string;
  actionState: ConservationActionState;
  actionDate?: string | null;
  responsibleTeam?: string | null;
  notes?: string | null;
};

export type ConservationAction = {
  caseActionId: number;
  reportReference: string;
  actionTypeCode: string;
  actionTypeLabel: string;
  actionState: ConservationActionState;
  actionDate: string | null;
  responsibleTeam: string | null;
  notes: string | null;
  statusCode: ReportStatusCode;
  createdBy: number;
  createdByName: string | null;
  createdAt: string;
};

export type ConservationActionList = {
  reportReference: string;
  items: ConservationAction[];
  total: number;
};
