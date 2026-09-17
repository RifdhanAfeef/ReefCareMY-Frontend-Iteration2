import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createConservationAction,
  getConservationActions,
  getConservationActionTypes,
  uploadConservationActionEvidence,
} from "@/lib/api/coordinatorApi";
import { ConservationActionPanel } from "../conservation-action-panel";

vi.mock("@/lib/api/coordinatorApi");

const mockedGetActionTypes = vi.mocked(getConservationActionTypes);
const mockedGetActions = vi.mocked(getConservationActions);
const mockedCreateAction = vi.mocked(createConservationAction);
const mockedUploadActionEvidence = vi.mocked(uploadConservationActionEvidence);

beforeEach(() => {
  mockedGetActionTypes.mockReset();
  mockedGetActions.mockReset();
  mockedCreateAction.mockReset();
  mockedUploadActionEvidence.mockReset();

  mockedGetActionTypes.mockResolvedValue([
    { code: "reef_cleanup", label: "Reef clean-up", description: "Remove debris through an authorised response." },
  ]);
  mockedGetActions.mockResolvedValue({
    reportReference: "RC-0710",
    total: 1,
    items: [{
      caseActionId: 4,
      reportReference: "RC-0710",
      actionTypeCode: "reef_cleanup",
      actionTypeLabel: "Reef clean-up",
      actionState: "action_planned",
      actionDate: "2026-09-20",
      responsibleTeam: "Tioman response team",
      notes: "Awaiting safe sea conditions.",
      statusCode: "monitoring",
      createdBy: 8,
      createdByName: "Farid",
      createdAt: "2026-09-13T08:30:00Z",
    }],
  });
});

describe("Epic 7 conservation action record", () => {
  it("loads action history and distinguishes a plan from completed work", async () => {
    render(<ConservationActionPanel reportReference="RC-0710" />);

    expect(screen.queryByText(/Epic 7/i)).not.toBeInTheDocument();
    expect(screen.getByText("Conservation action")).toBeInTheDocument();
    expect(await screen.findByText("Action planned — not completed")).toBeInTheDocument();
    expect(screen.getByText("This is a plan only. It does not confirm that conservation work has happened.")).toBeInTheDocument();
    expect(screen.getByText("Tioman response team")).toBeInTheDocument();
  });

  it("requires a date before recording an action as taken", async () => {
    const user = userEvent.setup();
    render(<ConservationActionPanel reportReference="RC-0710" />);

    await screen.findByRole("heading", { name: "Record an action update" });
    await user.click(screen.getByLabelText(/Action taken/));
    await user.type(screen.getByLabelText("Responsible team *"), "Tioman response team");
    await user.click(screen.getByRole("button", { name: "Record action update" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter the date the action was taken.");
    expect(mockedCreateAction).not.toHaveBeenCalled();
  });

  it("records a planned action using the confirmed API fields", async () => {
    const user = userEvent.setup();
    mockedCreateAction.mockResolvedValue({
      caseActionId: 5,
      reportReference: "RC-0710",
      actionTypeCode: "reef_cleanup",
      actionTypeLabel: "Reef clean-up",
      actionState: "action_planned",
      actionDate: "2026-09-20",
      responsibleTeam: "Marine Park response team",
      notes: "Equipment and weather check required.",
      statusCode: "monitoring",
      createdBy: 8,
      createdByName: "Farid",
      createdAt: "2026-09-13T09:30:00Z",
    });

    render(<ConservationActionPanel reportReference="RC-0710" />);
    await screen.findByRole("heading", { name: "Record an action update" });

    await user.type(screen.getByLabelText("Planned action date, format dd/mm/yyyy"), "20092026");
    await user.type(screen.getByLabelText("Responsible team *"), "Marine Park response team");
    await user.type(screen.getByLabelText(/^Action notes/), "Equipment and weather check required.");
    await user.click(screen.getByRole("button", { name: "Record action update" }));

    await waitFor(() => expect(mockedCreateAction).toHaveBeenCalledWith("RC-0710", {
      actionTypeCode: "reef_cleanup",
      actionState: "action_planned",
      actionDate: "2026-09-20",
      responsibleTeam: "Marine Park response team",
      notes: "Equipment and weather check required.",
    }));
    expect(await screen.findByText("The planned conservation action was recorded without marking it as completed.")).toBeInTheDocument();
  });

  it("attaches a supported evidence image to the newly recorded action", async () => {
    const user = userEvent.setup();
    mockedCreateAction.mockResolvedValue({
      caseActionId: 6,
      reportReference: "RC-0710",
      actionTypeCode: "reef_cleanup",
      actionTypeLabel: "Reef clean-up",
      actionState: "action_planned",
      actionDate: null,
      responsibleTeam: "Marine Park response team",
      notes: null,
      statusCode: "monitoring",
      createdBy: 8,
      createdByName: "Farid",
      createdAt: "2026-09-13T09:30:00Z",
      evidence: [],
    });
    mockedUploadActionEvidence.mockResolvedValue({
      evidenceId: 19,
      mediaType: "image/jpeg",
      fileSizeBytes: 13,
      uploadedAt: "2026-09-13T09:31:00Z",
      caseActionId: 6,
    });
    const file = new File(["reef evidence"], "completed-action.jpg", { type: "image/jpeg" });

    render(<ConservationActionPanel reportReference="RC-0710" />);
    await screen.findByRole("heading", { name: "Record an action update" });
    await user.type(screen.getByLabelText("Responsible team *"), "Marine Park response team");
    await user.upload(screen.getByLabelText("Choose action evidence image"), file);
    await user.click(screen.getByRole("button", { name: "Record action update" }));

    await waitFor(() => expect(mockedUploadActionEvidence).toHaveBeenCalledWith("RC-0710", 6, file));
    expect(await screen.findByText(/The evidence image was attached/i)).toBeInTheDocument();
    expect(screen.getByText("1 evidence image attached")).toBeInTheDocument();
  });
});
