"use client";

import { useEffect, useState } from "react";
import { getReportDetail } from "@/lib/api/reportsApi";
import type { ReportDetail as ReportDetailData } from "@/lib/api/types";
import { userFacingError } from "@/lib/api/user-facing-error";
import styles from "./report-detail.module.css";

type LoadState = "loading" | "loaded" | "error";

export function ReportDetail({ reportReference }: { reportReference: string }) {
  const [report, setReport] = useState<ReportDetailData | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getReportDetail(reportReference)
      .then((result) => {
        if (!cancelled) {
          setReport(result);
          setState("loaded");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(userFacingError(err, "We couldn’t load this report right now."));
          setState("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reportReference]);

  if (state === "loading") {
    return <p>Loading report…</p>;
  }

  if (state === "error" || !report) {
    return <p role="alert">{error ?? "We couldn’t load this report right now."}</p>;
  }

  return (
    <div className={styles.detail}>
      <dl className={styles.summary}>
        <div className={styles.row}>
          <dt>Threat type</dt>
          <dd>{report.threatCategory}</dd>
        </div>
        <div className={styles.row}>
          <dt>Location</dt>
          <dd>{report.diveSite ?? report.generalLocation}</dd>
        </div>
        <div className={styles.row}>
          <dt>Observed</dt>
          <dd>
            <time dateTime={report.observedAt}>{new Date(report.observedAt).toLocaleString()}</time>
          </dd>
        </div>
        {report.estimatedDepthMetres != null && (
          <div className={styles.row}>
            <dt>Estimated depth</dt>
            <dd>{report.estimatedDepthMetres} m</dd>
          </div>
        )}
      </dl>

      <p className={styles.description}>{report.description}</p>

      {report.preciseLocation?.latitude != null && report.preciseLocation?.longitude != null && (
        <p className={styles.precise}>
          Exact location: {report.preciseLocation.latitude}, {report.preciseLocation.longitude}
          {report.preciseLocation.uncertaintyMetres != null &&
            ` (± ${report.preciseLocation.uncertaintyMetres} m)`}
        </p>
      )}

      {report.informationRequestReason && (
        <p className={styles.infoRequest} role="status">
          More information needed: {report.informationRequestReason}
        </p>
      )}

      {report.closure && (
        <p className={styles.closure}>
          {report.closure.closureLabel}
          {report.closure.publicNote && ` — ${report.closure.publicNote}`}
        </p>
      )}
    </div>
  );
}
