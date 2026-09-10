import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DisplayDateInput } from "../display-date-input";
import { todayInputDateValue } from "@/lib/format/date";

function TestInput() {
  const [value, setValue] = useState("");
  return <DisplayDateInput label="Observation date" value={value} onChange={setValue} />;
}

describe("DisplayDateInput", () => {
  it("formats numeric typing as dd/mm/yyyy", async () => {
    const user = userEvent.setup();
    render(<TestInput />);

    const input = screen.getByLabelText("Observation date, format dd/mm/yyyy");
    await user.type(input, "05092026");

    expect(input).toHaveValue("05/09/2026");
  });

  it("prevents the native calendar from selecting a future date", () => {
    const { container } = render(<TestInput />);
    const picker = container.querySelector('input[type="date"]');

    expect(picker).toHaveAttribute("max", todayInputDateValue());
  });
});
