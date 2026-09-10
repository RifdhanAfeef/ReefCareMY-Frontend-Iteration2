import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "../client";
import {
  claimReport,
  closeCase,
  getCoordinatorCase,
  getCoordinatorEvidence,
  getCoordinatorQueue,
  recordEvidenceAssessment,
  recordCaseDecision,
  requestMoreInformation,
  startReview,
} from "../coordinatorApi";

vi.mock("../client");
const mockedApiRequest = vi.mocked(client.apiRequest);
const mockedApiBlobRequest = vi.mocked(client.apiBlobRequest);

beforeEach(() => {
  mockedApiRequest.mockReset();
  mockedApiRequest.mockResolvedValue({} as never);
  mockedApiBlobRequest.mockReset();
  mockedApiBlobRequest.mockResolvedValue(new Blob());
});

describe("coordinator API contract", () => {
  it("uses public report references for queue, claim and case detail", async () => {
    await getCoordinatorQueue();
    await claimReport("RC-0241");
    await getCoordinatorCase("RC-0241");
    expect(mockedApiRequest.mock.calls.map(([request]) => request.path)).toEqual([
      "/api/v1/coordinator/queue?page=1&pageSize=20",
      "/api/v1/coordinator/reports/RC-0241/claim",
      "/api/v1/coordinator/reports/RC-0241",
    ]);
  });

  it("uses the start-review, evidence-assessment and protected evidence contracts", async () => {
    await startReview("RC-0241");
    await recordEvidenceAssessment("RC-0241", {
      evidenceUsable: true,
      observationCredible: true,
      notes: "Evidence supports the report.",
    });
    await getCoordinatorEvidence("RC-0241", 13);

    expect(mockedApiRequest.mock.calls).toEqual([
      [{ path: "/api/v1/coordinator/reports/RC-0241/start-review", method: "POST" }],
      [{
        path: "/api/v1/coordinator/reports/RC-0241/evidence-assessment",
        method: "POST",
        body: {
          evidenceUsable: true,
          observationCredible: true,
          notes: "Evidence supports the report.",
        },
      }],
    ]);
    expect(mockedApiBlobRequest).toHaveBeenCalledWith({
      path: "/api/v1/coordinator/reports/RC-0241/evidence/13",
      timeoutMs: 60_000,
    });
  });

  it("uses the documented information, decision and closure bodies", async () => {
    await requestMoreInformation("RC-0002", "Please confirm the approximate size.");
    await recordCaseDecision("RC-0002", {
      responseType: "refer_or_share",
      referredTo: "Marine Park Department",
    });
    await closeCase("RC-0002", {
      closureReasonCode: "referred_other_org",
      publicClosureNote: "Shared for consideration.",
      referredTo: "Marine Park Department",
    });

    expect(mockedApiRequest.mock.calls.map(([request]) => request.body)).toEqual([
      { reason: "Please confirm the approximate size." },
      { responseType: "refer_or_share", referredTo: "Marine Park Department" },
      {
        closureReasonCode: "referred_other_org",
        publicClosureNote: "Shared for consideration.",
        referredTo: "Marine Park Department",
      },
    ]);
  });
});
