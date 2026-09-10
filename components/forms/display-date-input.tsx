"use client";

import { useRef } from "react";
import {
  displayDateToInputValue,
  formatDisplayDateInput,
  inputDateToDisplayValue,
  todayInputDateValue,
} from "@/lib/format/date";

type DisplayDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  label: string;
};

export function DisplayDateInput({
  value,
  onChange,
  required = false,
  invalid = false,
  describedBy,
  label,
}: DisplayDateInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const picker = pickerRef.current;
    if (!picker) return;

    try {
      picker.showPicker();
    } catch {
      picker.focus();
      picker.click();
    }
  }

  return (
    <div className="display-date-input" data-invalid={invalid || undefined}>
      <input
        className="display-date-input__text"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={10}
        placeholder="dd/mm/yyyy"
        value={value}
        onChange={(event) => onChange(formatDisplayDateInput(event.target.value))}
        required={required}
        aria-label={`${label}, format dd/mm/yyyy`}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <span className="display-date-input__picker-wrap">
        <button
          className="display-date-input__picker-button"
          type="button"
          onClick={openCalendar}
          aria-label={`Choose ${label.toLowerCase()} from calendar`}
        >
          <svg
            className="display-date-input__icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          ref={pickerRef}
          className="display-date-input__picker"
          type="date"
          value={displayDateToInputValue(value)}
          max={todayInputDateValue()}
          onChange={(event) => onChange(inputDateToDisplayValue(event.target.value))}
          aria-hidden="true"
          tabIndex={-1}
        />
      </span>
    </div>
  );
}
