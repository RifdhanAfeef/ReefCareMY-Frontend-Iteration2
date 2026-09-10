import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyReports, getReportDetail, getReportTimeline } from "../reportsApi";
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
