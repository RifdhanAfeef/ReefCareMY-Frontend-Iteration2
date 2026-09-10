"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./report-confirmation.module.css";

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ReportConfirmation() {
  const searchParams = useSearchParams();

  const reportReference = searchParams.get("reportReference");
  const status = searchParams.get("status");
  const submittedAt = searchParams.get("submittedAt");
  const generalLocation = searchParams.get("generalLocation");
  const threatCategory = searchParams.get("threatCategory");

  if (!reportReference || !status || !submittedAt || !generalLocation || !threatCategory) {
    return (
      <p>
        We don&apos;t have your submission details here. Check{" "}
        <Link href="/my-reports">My reports</Link> instead.
      </p>
    );
  }

  return (
    <div className={styles.confirmation}>
      <dl className={styles.summary}>
      <div className={styles.row}>
        <dt>Report ID</dt>
        <dd>{reportReference}</dd>
      </div>
      <div className={styles.row}>
        <dt>Threat type</dt>
        <dd>{threatCategory}</dd>
      </div>
      <div className={styles.row}>
        <dt>Location</dt>
        <dd>{generalLocation}</dd>
      </div>
      <div className={styles.row}>
        <dt>Submitted</dt>
        <dd>
          <time dateTime={submittedAt}>{new Date(submittedAt).toLocaleString()}</time>
        </dd>
      </div>
      <div className={styles.row}>
        <dt>Status</dt>
        <dd>{capitalize(status)}</dd>
      </div>
      </dl>
      <div className={styles.actions}>
        <Link className={styles.primaryAction} href={`/my-reports/${encodeURIComponent(reportReference)}`}>Open this report</Link>
        <Link className={styles.secondaryAction} href="/report-a-reef">Start another report</Link>
      </div>
    </div>
  );
}
