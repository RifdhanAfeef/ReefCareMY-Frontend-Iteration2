"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import type { UserRole } from "@/lib/api/types";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return null;
  }

  return <>{children}</>;
}

const roleHome: Record<UserRole, string> = {
  observer: "/my-reports",
  case_coordinator: "/coordinator/report-queue",
  system_administrator: "/admin/users",
};

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (status === "authenticated" && user?.role !== role) {
      router.replace(user ? roleHome[user.role] : "/");
    }
  }, [status, user, role, pathname, router]);

  if (status !== "authenticated" || user?.role !== role) {
    return null;
  }

  return <>{children}</>;
}
