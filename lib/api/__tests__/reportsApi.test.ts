import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMyReports,
  getOpenInformationRequest,
  getReportDetail,
  getReportTimeline,
  submitInformationResponse,
} from "../reportsApi";
import * as client from "../client";

vi.mock("../client");
const mockedApiRequest = vi.mocked(client.apiRequest);

beforeEach(() => {
  mockedApiRequest.mockReset();
  mockedApiRequest.mockResolvedValue({} as never);
});

describe("getMyReports", () => {
  it("calls GET /api/v1/reports/mine with no query string when no filters are given", async () => {
    await getMyReports();

    expect(mockedApiRequest.mock.calls[0][0].path).toBe("/api/v1/reports/mine");
  });

  it("encodes filters as query parameters", async () => {
    await getMyReports({ status: "needs_more_info", page: 2, pageSize: 10 });

    const { path } = mockedApiRequest.mock.calls[0][0];
    const [, query] = path.split("?");
    const params = new URLSearchParams(query);
    expect(params.get("status")).toBe("needs_more_info");
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("10");
  });
});

describe("getReportDetail", () => {
  it("calls GET /api/v1/reports/{report_reference}", async () => {
    await getReportDetail("RC-0241");

    expect(mockedApiRequest.mock.calls[0][0].path).toBe("/api/v1/reports/RC-0241");
  });
});

describe("getReportTimeline", () => {
  it("calls GET /api/v1/reports/{report_reference}/timeline", async () => {
    await getReportTimeline("RC-0241");

    expect(mockedApiRequest.mock.calls[0][0].path).toBe("/api/v1/reports/RC-0241/timeline");
  });
});

describe("observer information requests", () => {
  it("loads the open request for the observer's report", async () => {
    await getOpenInformationRequest("RC/0241");

    expect(mockedApiRequest.mock.calls[0][0].path)
      .toBe("/api/v1/reports/RC%2F0241/information-request");
  });

  it("submits text to the same report without creating a new report", async () => {
    await submitInformationResponse("RC-0241", { text: "The net was about 3 metres wide.", evidenceIds: [] });

    expect(mockedApiRequest).toHaveBeenCalledWith({
      path: "/api/v1/reports/RC-0241/information-response",
      method: "POST",
      body: { text: "The net was about 3 metres wide.", evidenceIds: [] },
    });
  });

  it("uses multipart form data when new photographs accompany the response", async () => {
    const photo = new File(["reef-photo"], "clearer-reef.jpg", { type: "image/jpeg" });
    const payload = { text: "Here is a clearer photograph.", evidenceIds: [] };

    await submitInformationResponse("RC-0241", payload, [photo]);

    const request = mockedApiRequest.mock.calls[0][0];
    expect(request).toMatchObject({
      path: "/api/v1/reports/RC-0241/information-response",
      method: "POST",
      timeoutMs: 60_000,
    });
    expect(request.body).toBeInstanceOf(FormData);
    const body = request.body as FormData;
    expect(JSON.parse(String(body.get("payload")))).toEqual(payload);
    expect(body.getAll("photos")).toEqual([photo]);
  });
});
