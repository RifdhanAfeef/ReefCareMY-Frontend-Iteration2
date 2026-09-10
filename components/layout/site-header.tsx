"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { HeaderAction, NavigationItem } from "@/config/navigation";
import { useAuth } from "@/features/epic-01-access/auth-context";
import type { UserRole } from "@/lib/api/types";
import { Brand } from "./brand";
import styles from "./site-header.module.css";

type SiteHeaderProps = {
  navigation: NavigationItem[];
  actions?: HeaderAction[];
  identity?: {
    label: string;
    initial: string;
  };
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  navigation,
  actions = [],
  identity,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const roleLabels: Record<UserRole, string> = {
    observer: "Registered Observer",
    case_coordinator: "Case Coordinator",
    system_administrator: "System Administrator",
  };
  const resolvedIdentity = identity ?? (user
    ? { label: roleLabels[user.role], initial: user.displayName.trim().charAt(0).toUpperCase() || "U" }
    : undefined);

  async function signOut() {
    await logout();
    router.push("/");
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Brand />

        <nav className={styles.navigation} aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                className={`${styles.navLink} ${active ? styles.active : ""}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {(resolvedIdentity || actions.length > 0) && (
          <div className={styles.actions}>
            {resolvedIdentity && (
              <div className={styles.identity} aria-label={`Signed in as ${resolvedIdentity.label}`}>
                <span>{resolvedIdentity.label}</span>
                <span className={styles.avatar} aria-hidden="true">
                  {resolvedIdentity.initial}
                </span>
              </div>
            )}
            {actions.map((action) => action.label === "Log out" ? (
              <button
                key={`${action.href}-${action.label}`}
                className={`${styles.action} ${styles[action.variant]}`}
                type="button"
                onClick={signOut}
              >
                {action.label}
              </button>
            ) : (
              <Link
                key={`${action.href}-${action.label}`}
                className={`${styles.action} ${styles[action.variant]}`}
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
