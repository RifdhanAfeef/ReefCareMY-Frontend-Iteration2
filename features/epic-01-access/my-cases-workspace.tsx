"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCoordinatorQueue } from "@/lib/api/coordinatorApi";
import type { CoordinatorQueueItem } from "@/lib/api/types";
import { readStoredAuth } from "@/lib/api/token-store";
import { userFacingError } from "@/lib/api/user-facing-error";
import { formatDateTime } from "@/lib/format/date";
import { StatusPill } from "./status-pill";
import styles from "./access-ui.module.css";

type MyCaseRow = Pick<
  CoordinatorQueueItem,
  | "reportReference"
  | "threat"
  | "area"
  | "priority"
  | "priorityReasons"
  | "claimedAt"
  | "statusLabel"
>;

function displayDateTime(value?: string | null) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateTime(parsed);
}

function humanise(value?: string | null, fallback = "Not set") {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function priorityKey(value?: string | null) {
  return (value ?? "not_set").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function MyCasesWorkspace() {
  const currentUserId = readStoredAuth()?.user.id;
  const [cases, setCases] = useState<MyCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      setError("");
      try {
        const firstPage = await getCoordinatorQueue(1, 100);
        const pageSize = firstPage.pageSize || 100;
        const totalPages = Math.max(1, Math.ceil(firstPage.total / pageSize));
        const remainingPages = totalPages > 1
          ? await Promise.all(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                getCoordinatorQueue(index + 2, pageSize),
              ),
            )
          : [];
        if (!cancelled) {
          setCases(
            [firstPage, ...remainingPages]
              .flatMap((queuePage) => queuePage.items)
              .filter((record) => record.owner?.id === currentUserId),
          );
          setLoading(false);
        }
      } catch (queueError) {
        if (cancelled) return;
        setCases([]);
        setError(userFacingError(queueError, "Your claimed cases could not be loaded right now."));
        setLoading(false);
      }
    }

    void loadCases();
    return () => { cancelled = true; };
  }, [currentUserId, reloadKey]);

  function retry() {
    setLoading(true);
    setError("");
    setReloadKey((value) => value + 1);
  }

  if (loading) {
    return <section className={styles.card}><div className={styles.emptyState} role="status"><h2 className={styles.sectionHeading}>Loading your claimed cases…</h2><p>Retrieving your current cases.</p></div></section>;
  }

  if (cases.length === 0) {
    return <section className={styles.card}><div className={styles.emptyState}><h2 className={styles.sectionHeading}>{error ? "Your cases are unavailable" : "You have no claimed cases"}</h2><p>{error || "Reports you claim from the queue will appear here."}</p>{error && <button className={styles.secondaryButton} type="button" onClick={retry}>Try again</button>}<Link className={styles.primaryButton} href="/coordinator/report-queue">Open report queue</Link></div></section>;
  }

  return <div className={styles.stack}>
    <section className={styles.tableCard} aria-label="Cases owned by this coordinator"><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">Report</th><th scope="col">Threat</th><th scope="col">General area</th><th scope="col">Priority</th><th scope="col">Claimed</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{cases.map((record) => <tr key={record.reportReference}><td className={styles.identifier}>{record.reportReference}</td><td>{record.threat}</td><td>{record.area ?? "Not provided"}</td><td><span className={styles.priorityChip} data-priority={priorityKey(record.priority)}>{humanise(record.priority)}</span>{(record.priorityReasons ?? []).length > 0 && <details className={styles.priorityDetails}><summary>Why?<span className="sr-only"> Priority reasons for {record.reportReference}</span></summary><ul>{record.priorityReasons?.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>}</td><td>{displayDateTime(record.claimedAt)}</td><td><StatusPill status={record.statusLabel} /></td><td><Link className={styles.textButton} href={`/coordinator/reports/${record.reportReference}`}>Open case<span className="sr-only"> {record.reportReference}</span></Link></td></tr>)}</tbody></table></div></section>
  </div>;
}
