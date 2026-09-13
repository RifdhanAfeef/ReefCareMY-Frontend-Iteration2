export function formatDateTime(date = new Date()) {
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${datePart}, ${timePart.toUpperCase()}`;
}

export function isValidDisplayDate(value: string) {
  if (!value) return true;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function isFutureDisplayDate(value: string, now = new Date()) {
  if (!isValidDisplayDate(value)) return false;
  const [day, month, year] = value.split("/").map(Number);
  const supplied = Date.UTC(year, month - 1, day);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return supplied > today;
}

export function isFutureDisplayDateTime(
  dateValue: string,
  timeValue: string,
  now = new Date(),
) {
  if (!isValidDisplayDate(dateValue) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) {
    return false;
  }

  const [day, month, year] = dateValue.split("/").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute).getTime() > now.getTime();
}

export function displayDateToInputValue(value: string) {
  if (!value || !isValidDisplayDate(value)) return "";
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

export function inputDateToDisplayValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function formatDisplayDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean);
  return parts.join("/");
}

export function todayInputDateValue(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function displayDateToIsoDate(value: string) {
  if (!isValidDisplayDate(value) || !value) {
    throw new Error("Enter a valid date in dd/mm/yyyy format.");
  }
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

export function displayDateAndTimeToIso(dateValue: string, timeValue: string) {
  const isoDate = displayDateToIsoDate(dateValue);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(timeValue)) {
    throw new Error("Enter a valid time.");
  }
  return new Date(`${isoDate}T${timeValue}:00`).toISOString();
}
