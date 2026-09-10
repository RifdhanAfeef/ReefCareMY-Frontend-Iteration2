"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AccountStatus, UserAccount, UserRoleCode } from "./types";
import { readCreatedUsers } from "./admin-user-storage";
import { getUserRoleLabel, userRoleOptions } from "./role-catalog";
import { StatusPill } from "./status-pill";
import styles from "./access-ui.module.css";

type UserDirectoryProps = {
  initialUsers: UserAccount[];
};

const statuses: AccountStatus[] = ["Active", "Pending", "Suspended"];

export function UserDirectory({ initialUsers }: UserDirectoryProps) {
  const [accounts, setAccounts] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleCode | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const createdUsers = readCreatedUsers();
    if (createdUsers.length > 0) {
      const initialIds = new Set(initialUsers.map((user) => user.id));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccounts([...initialUsers, ...createdUsers.filter((user) => !initialIds.has(user.id))]);
    }
  }, [initialUsers]);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return accounts.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.id.toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [accounts, query, roleFilter]);

  const selectedUser = accounts.find((user) => user.id === selectedId) ?? null;

  function updateSelectedUser(
    field: "role" | "status",
    value: UserRoleCode | AccountStatus,
  ) {
    if (!selectedUser) return;
    setAccounts((current) =>
      current.map((user) =>
        user.id === selectedUser.id ? { ...user, [field]: value } : user,
      ),
    );
    setSavedMessage("");
  }

  function saveChanges() {
    if (!selectedUser) return;
    setSavedMessage(
      `Access settings for ${selectedUser.name} were saved for this preview only. No account permissions were changed.`,
    );
  }

  return (
    <div className={styles.stack}>
      <section className={styles.notice} role="status">
        <strong>Account changes are not available yet</strong>
        You can review users and access settings, but changes made here are saved
        only for this preview and do not alter real accounts.
      </section>
      <section className={styles.card} aria-labelledby="directory-title">
        <div className={styles.toolbar}>
          <div>
            <h2 className={styles.sectionHeading} id="directory-title">
              User directory
            </h2>
            <p className={styles.sectionDescription}>
              Registered accounts only. Unregistered site visitors do not have an
              account role. Case decisions remain outside the administrator role.
            </p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.field}>
            <label htmlFor="user-search">Search users</label>
            <input
              className={styles.input}
              id="user-search"
              type="search"
              placeholder="Name, email or user ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className={`${styles.field} ${styles.fieldCompact}`}>
            <label htmlFor="role-filter">Role</label>
            <select
              className={styles.select}
              id="role-filter"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as UserRoleCode | "all")
              }
            >
              <option value="all">All account roles</option>
              {userRoleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className={styles.tableCard} aria-label="ReefCare user accounts">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">User ID</th>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td className={styles.identifier}>{user.id}</td>
                  <td>
                    {user.name}
                    <div className={styles.muted}>{user.email}</div>
                  </td>
                  <td>{getUserRoleLabel(user.role)}</td>
                  <td>
                    <StatusPill status={user.status} />
                  </td>
                  <td>
                    {user.status === "Pending" ? (
                      <Link
                        className={styles.textButton}
                        href="/admin/role-requests"
                      >
                        Review requests
                      </Link>
                    ) : (
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => {
                          setSelectedId(user.id);
                          setSavedMessage("");
                        }}
                      >
                        {selectedId === user.id ? "Editing access" : "Edit access"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleUsers.length === 0 && (
          <div className={styles.emptyState}>
            No users match the current search and role filter.
          </div>
        )}
      </section>

      {selectedUser && (
        <section className={styles.detailCard} aria-labelledby="edit-access-title">
          <div className={styles.summaryRow}>
            <div>
              <h2 className={styles.sectionHeading} id="edit-access-title">
                Edit access for {selectedUser.name}
              </h2>
              <p className={styles.sectionDescription}>
                Role and account-status changes do not take effect from this preview.
              </p>
            </div>
            <button
              className={styles.textButton}
              type="button"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="account-role">Role</label>
              <select
                className={styles.select}
                id="account-role"
                value={selectedUser.role}
                onChange={(event) =>
                  updateSelectedUser("role", event.target.value as UserRoleCode)
                }
              >
                {userRoleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="account-status">Account status</label>
              <select
                className={styles.select}
                id="account-status"
                value={selectedUser.status}
                onChange={(event) =>
                  updateSelectedUser("status", event.target.value as AccountStatus)
                }
              >
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {savedMessage && (
            <p className={styles.notice} role="status">
              {savedMessage}
            </p>
          )}

          <div className={styles.buttonRow}>
            <button className={styles.primaryButton} type="button" onClick={saveChanges}>
              Save access settings
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setSelectedId(null)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
