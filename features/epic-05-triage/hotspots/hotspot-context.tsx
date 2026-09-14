"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { getHotspotContext, hotspotQuery } from "@/lib/api/hotspotsApi";
import { malaysiaTime, periodLabel, validateHotspotFilters } from "./filters";
import { HotspotLoading } from "./hotspot-status";
import { useHotspotResource } from "./use-hotspot-resource";
import styles from "./hotspots.module.css";

/** Fetch independently, only after the existing owned-case request succeeded. */
export function HotspotCaseContext({ reportReference }: { reportReference: string }) {
  const [revision, setRevision] = useState(0);
  const load = useCallback((signal: AbortSignal) => getHotspotContext(reportReference, signal), [reportReference]);
  const result = useHotspotResource(`context:${reportReference}:${revision}`, load);
  const context = result.data;
  return <section className={styles.context} aria-label="Area reporting context">
    <div><p className={styles.eyebrow}>Area reporting context</p><h2>{context?.site?.name ?? "Reporting around this site"}</h2></div>
    {result.loading ? <HotspotLoading message="Loading area context…" /> : !context || context.state === "unavailable" ? <div role="status"><p>Area context is unavailable. Continue reviewing the case.</p><button className={styles.textButton} type="button" onClick={() => setRevision((value) => value + 1)}>Retry area context</button></div> : <>
      <div><p>{context.reportCount !== null ? <><strong>{context.reportCount} reports</strong> in this named-site selection</> : context.message}</p>{context.filters && <small>{periodLabel(context.filters)} · MYT</small>}{context.lastSuccessfulUpdateAt && <small>Updated {malaysiaTime(context.lastSuccessfulUpdateAt)} MYT</small>}</div>
      {context.filters && context.analysisQuery && !validateHotspotFilters(context.filters) && <Link className={styles.secondaryButton} href={`/coordinator/hotspots?${hotspotQuery(context.filters)}`}>View area on hotspot map ↗</Link>}
    </>}
  </section>;
}
