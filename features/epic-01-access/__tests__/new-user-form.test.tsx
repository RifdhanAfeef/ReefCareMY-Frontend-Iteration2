import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewUserForm } from "../new-user-form";
import { UserDirectory } from "../user-directory";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
});

describe("Administrator account creation", () => {
  it("offers every account role", () => {
    render(<NewUserForm existingUsers={[]} />);

    expect(screen.getByRole("option", { name: "Registered Observer" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Case Coordinator" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "System Administrator" })).toBeInTheDocument();
  });

  it("creates an active account without storing its password", async () => {
    render(<NewUserForm existingUsers={[]} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Display name"), "Farah Aziz");
    await user.type(screen.getByLabelText("Email"), "farah@example.org");
    await user.selectOptions(screen.getByLabelText("Account role"), "case_coordinator");
    await user.type(screen.getByLabelText("Temporary password"), "temporary-pass-2026");
    await user.type(screen.getByLabelText("Confirm temporary password"), "temporary-pass-2026");
    await user.click(screen.getByRole("button", { name: "Create user account" }));

    const stored = window.localStorage.getItem("reefcare.admin-created-users") ?? "";
    expect(stored).toContain("farah@example.org");
    expect(stored).toContain("case_coordinator");
    expect(stored).not.toContain("temporary-pass-2026");
    expect(push).toHaveBeenCalledWith("/admin/users");
  });

  it("accepts the current 12-character temporary-password minimum", async () => {
    render(<NewUserForm existingUsers={[]} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Display name"), "Farah Aziz");
    await user.type(screen.getByLabelText("Email"), "farah@example.org");
    await user.type(screen.getByLabelText("Temporary password"), "reefcare1234");
    await user.type(screen.getByLabelText("Confirm temporary password"), "reefcare1234");

    expect(screen.getByText("Met: At least 12 characters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create user account" })).toBeEnabled();
  });

  it("shows locally created accounts in the directory", async () => {
    window.localStorage.setItem(
      "reefcare.admin-created-users",
      JSON.stringify([
        {
          id: "USR-900001",
          name: "New Administrator",
          email: "new-admin@example.org",
          role: "system_administrator",
          status: "Active",
        },
      ]),
    );

    render(<UserDirectory initialUsers={[]} />);

    const userName = await screen.findByText("New Administrator");
    const row = userName.closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLTableRowElement).getByText("System Administrator")).toBeInTheDocument();
  });
});
