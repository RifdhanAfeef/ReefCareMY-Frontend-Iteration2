import type { UserRoleCode } from "./types";

export const userRoleOptions: ReadonlyArray<{
  value: UserRoleCode;
  label: string;
}> = [
  { value: "observer", label: "Registered Observer" },
  { value: "case_coordinator", label: "Case Coordinator" },
  { value: "system_administrator", label: "System Administrator" },
];

export function getUserRoleLabel(role: UserRoleCode) {
  return userRoleOptions.find((option) => option.value === role)?.label ?? role;
}
