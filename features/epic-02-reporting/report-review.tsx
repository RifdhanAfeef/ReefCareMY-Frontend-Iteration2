"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReviewLocationSummary } from "@/features/epic-04-location/location-flow";
import { useMockAppState } from "@/features/shared/mock-app-state";
import { isFutureDisplayDateTime, isValidDisplayDate } from "@/lib/format/date";
import { submitReport as submitReportApi } from "@/lib/api/reportsApi";
import { userFacingError } from "@/lib/api/user-facing-error";
import { clearDraftPhotos, loadDraftPhotos, type StoredDraftPhoto } from "./draft-storage";
import { getThreatCategory } from "./threat-data";
import { buildReportSubmissionPayload } from "./report-payload";
import styles from "./reporting.module.css";

type ReviewPhoto = StoredDraftPhoto & { previewUrl: string };

export function ReportReview() {
  const router = useRouter();
  const { reportDraft, locationDraft, resetReportDraft } = useMockAppState();
  const [photos, setPhotos] = useState<ReviewPhoto[]>([]);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState("");
  const submissionInProgress = useRef(false);
  const [submissionError, setSubmissionError] = useState("");
  const threat = getThreatCategory(reportDraft.threatCategoryCode);
  const session = locationDraft.sessions.find((item) => item.id === locationDraft.selectedSessionId);

  useEffect(() => {
    let cancelled = false;
    const createdPreviewUrls: string[] = [];
    loadDraftPhotos()
      .then((stored) => {
        if (cancelled) return;
        const restored = stored.map((photo) => {
          const previewUrl = URL.createObjectURL(photo.file);
          createdPreviewUrls.push(previewUrl);
          return { ...photo, previewUrl };
        });
        setPhotos(restored);
      })
      .catch(() => setPhotoLoadFailed(true));
    return () => {
      cancelled = true;
      createdPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const missingItems = useMemo(() => {
    const items: string[] = [];
    if (photos.length === 0) items.push("at least one photograph");
    if (!threat || !reportDraft.threatCategoryId) items.push("threat category");
    if (!reportDraft.observationDate || !isValidDisplayDate(reportDraft.observationDate)) items.push("valid observation date");
    if (!reportDraft.observationTime) items.push("observation time");
    else if (isFutureDisplayDateTime(reportDraft.observationDate, reportDraft.observationTime)) items.push("observation date and time that are not in the future");
    if (!reportDraft.description.trim()) items.push("description");
    if (!session?.backendId || !locationDraft.confidence) items.push("Dive Session, location and confidence");
    return items;
  }, [locationDraft.confidence, photos.length, reportDraft, session, threat]);

  async function submit() {
    if (missingItems.length > 0 || submissionInProgress.current) return;
    submissionInProgress.current = true;
    setSubmitting(true);
    setSubmissionError("");
    try {
      const payload = buildReportSubmissionPayload(reportDraft, locationDraft);
      const result = await submitReportApi(payload, photos.map((photo) => photo.file));
      const query = new URLSearchParams({
        reportReference: result.reportReference,
        status: result.status,
        submittedAt: result.submittedAt,
        generalLocation: result.generalLocation,
        threatCategory: threat?.label ?? "Not provided",
      });
      const destination = `/report-a-reef/confirmation?${query.toString()}`;
      setConfirmationUrl(destination);
      // A local cleanup failure cannot undo a successful server submission.
      await clearDraftPhotos().catch(() => undefined);
      resetReportDraft();
      router.push(destination);
    } catch (error) {
      setSubmissionError(userFacingError(error, "The report could not be submitted."));
      setSubmitting(false);
      submissionInProgress.current = false;
    }
  }

  if (confirmationUrl) {
    return <section className={styles.card}>
      <div role="status"><h2>Report submitted</h2><p>Opening your confirmation…</p></div>
      <Link className={styles.primaryButton} href={confirmationUrl}>View confirmation</Link>
    </section>;
  }

  return (
    <div className={styles.stack}>
      {missingItems.length > 0 && <section className={styles.errorBox} role="alert"><strong>Complete the report before submitting</strong><p>Missing: {missingItems.join(", ")}.</p><Link className={styles.textButton} href="/report-a-reef">Return to observation details</Link></section>}
      {photoLoadFailed && <section className={styles.errorBox}><strong>Photographs could not be restored</strong><p>Return to the observation form and select the evidence again.</p></section>}
      {submissionError && <section className={styles.errorBox} role="alert"><strong>Report not submitted</strong><p>{submissionError}</p></section>}

      <div className={styles.reviewLayout}>
        <div className={styles.reviewMain}>
          <section className={styles.card}>
            <div className={styles.sectionHeader}><div><h2>Observation summary</h2><p>This is the information that will be lodged with ReefCare MY.</p></div><Link className={styles.textButton} href="/report-a-reef">Edit observation</Link></div>
            {photos.length > 0 && <div className={styles.reviewPhotos}>{photos.map((photo) => <article className={styles.reviewPhoto} key={photo.id}><Image className={styles.photoImage} src={photo.previewUrl} alt={`Evidence preview: ${photo.file.name}`} width={520} height={320} unoptimized /><p title={photo.file.name}>{photo.file.name}</p></article>)}</div>}
            <dl className={styles.summaryList}>
              <div><dt>Threat category</dt><dd>{threat?.label ?? "Not provided"}</dd></div>
              <div><dt>Observed</dt><dd>{reportDraft.observationDate && reportDraft.observationTime ? `${reportDraft.observationDate}, ${reportDraft.observationTime}` : "Not provided"}</dd></div>
              <div><dt>Estimated depth</dt><dd>{reportDraft.estimatedDepthMetres ? `${reportDraft.estimatedDepthMetres} m` : "Not provided"}</dd></div>
              <div><dt>Photographs</dt><dd>{photos.length || "Not provided"}</dd></div>
              <div className={styles.fullWidth}><dt>Description</dt><dd className={styles.description}>{reportDraft.description.trim() || "Not provided"}</dd></div>
            </dl>
          </section>
          <ReviewLocationSummary />
        </div>

        <aside className={styles.sideCard}>
          <h2>Before submitting</h2>
          <ul className={styles.checkList}><li>The details describe what you observed</li><li>No scientific diagnosis is required</li><li>Exact coordinates remain protected</li><li>Submission creates a traceable report</li></ul>
          <div className={styles.infoBox}><strong>Initial status: Received</strong><p>Submission places the report in the Case Coordinator queue. Claiming and evidence decisions occur later.</p></div>
          <button className={styles.primaryButton} type="button" disabled={missingItems.length > 0 || submitting} onClick={submit}>{submitting ? "Submitting…" : "Submit report"}</button>
        </aside>
      </div>
    </div>
  );
}
