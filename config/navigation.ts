export type NavigationItem = {
  label: string;
  href: string;
};

export type HeaderAction = NavigationItem & {
  variant: "outline" | "primary";
};

export const publicNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
];

export const publicActions: HeaderAction[] = [
  { label: "Log in", href: "/login", variant: "outline" },
  { label: "Create account", href: "/register", variant: "primary" },
];

export const observerNavigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Report a Reef", href: "/report-a-reef" },
  { label: "My Reports", href: "/my-reports" },
];

export const coordinatorNavigation: NavigationItem[] = [
  { label: "Report intake", href: "/coordinator/report-queue" },
  { label: "My cases", href: "/coordinator/my-cases" },
];

export const administratorNavigation: NavigationItem[] = [
  { label: "Users & roles", href: "/admin/users" },
  { label: "Access requests", href: "/admin/role-requests" },
];

export const signedInActions: HeaderAction[] = [
  { label: "Log out", href: "/login", variant: "outline" },
];
