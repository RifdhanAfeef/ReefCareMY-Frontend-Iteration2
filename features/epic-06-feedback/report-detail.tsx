"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getOpenInformationRequest,
  getReportDetail,
  submitInformationResponse,
} from "@/lib/api/reportsApi";
import type {
  ObserverInformationRequest,
  ReportDetail as ReportDetailData,
} from "@/lib/api/types";
import { userFacingError } from "@/lib/api/user-facing-error";
import { formatDateTime } from "@/lib/format/date";
import styles from "./report-detail.module.css";
import { readSubmittedStructuredDetails, type SubmittedStructuredDetails } from "@/features/epic-02-reporting/submitted-structured-details";

type LoadState = "loading" | "loaded" | "error";
type ResponsePhoto = { id: string; file: File; previewUrl: string };

const allowedPhotoTypes = ["image/png", "image/jpeg", "image/webp"];
const maximumPhotoSize = 10 * 1024 * 1024;
const maximumPhotoCount = 5;

function responsePhotoId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

export function ReportDetail({ reportReference }: { reportReference: string }) {
  const [report, setReport] = useState<ReportDetailData | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [informationRequest, setInformationRequest] = useState<ObserverInformationRequest | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseError, setResponseError] = useState("");
  const [responseSuccess, setResponseSuccess] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [responsePhotos, setResponsePhotos] = useState<ResponsePhoto[]>([]);
  const [responsePhotoMessage, setResponsePhotoMessage] = useState("");
  const structuredDetails = useMemo<SubmittedStructuredDetails>(() => readSubmittedStructuredDetails(reportReference), [reportReference]);
  const responsePreviewUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    getReportDetail(reportReference)
      .then(async (result) => {
        if (!cancelled) {
          setReport(result);
          setState("loaded");
        }
        if (result.status === "needs_more_info") {
          const request = await getOpenInformationRequest(reportReference).catch(() => null);
          if (!cancelled) setInformationRequest(request);
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

  useEffect(() => () => {
    responsePreviewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function chooseResponsePhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setResponseError("");

    if (responsePhotos.length + selected.length > maximumPhotoCount) {
      setResponsePhotoMessage(`You can attach up to ${maximumPhotoCount} photographs.`);
      return;
    }

    const emptyFile = selected.find((file) => file.size === 0);
    const invalidType = selected.find((file) => !allowedPhotoTypes.includes(file.type));
    const tooLarge = selected.find((file) => file.size > maximumPhotoSize);
    if (emptyFile) {
      setResponsePhotoMessage(`${emptyFile.name} is empty. Choose a valid photograph.`);
      return;
    }
    if (invalidType) {
      setResponsePhotoMessage(`${invalidType.name} is not supported. Choose a PNG, JPG or WebP image.`);
      return;
    }
    if (tooLarge) {
      setResponsePhotoMessage(`${tooLarge.name} is larger than the 10 MB limit.`);
      return;
    }

    const existingIds = new Set(responsePhotos.map((photo) => photo.id));
    const additions = selected
      .map((file) => ({ id: responsePhotoId(file), file }))
      .filter((photo) => !existingIds.has(photo.id))
      .map((photo) => {
        const previewUrl = URL.createObjectURL(photo.file);
        responsePreviewUrls.current.push(previewUrl);
        return { ...photo, previewUrl };
      });

    if (additions.length === 0) {
      setResponsePhotoMessage("Those photographs are already attached.");
      return;
    }

    setResponsePhotos((current) => [...current, ...additions]);
    setResponsePhotoMessage(`${additions.length} photograph${additions.length === 1 ? "" : "s"} ready to submit.`);
  }

  function removeResponsePhoto(id: string) {
    const removed = responsePhotos.find((photo) => photo.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
      responsePreviewUrls.current = responsePreviewUrls.current.filter((url) => url !== removed.previewUrl);
    }
    setResponsePhotos((current) => current.filter((photo) => photo.id !== id));
    setResponsePhotoMessage("Photograph removed.");
  }

  async function respondToRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = responseText.trim();
    setResponseError("");
    setResponseSuccess("");
    if (!text && responsePhotos.length === 0) {
      setResponseError("Add a written response or at least one photograph before submitting.");
      return;
    }

    setSubmittingResponse(true);
    try {
      const payload = {
        text,
        evidenceIds: [],
      };
      const selectedFiles = responsePhotos.map((photo) => photo.file);
      const result = selectedFiles.length > 0
        ? await submitInformationResponse(reportReference, payload, selectedFiles)
        : await submitInformationResponse(reportReference, payload);
      setReport((current) => current ? {
        ...current,
        status: result.status,
        statusLabel: "Being reviewed",
        informationRequestReason: null,
      } : current);
      setInformationRequest(null);
      setResponseText("");
      responsePhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      responsePreviewUrls.current = [];
      setResponsePhotos([]);
      setResponsePhotoMessage("");
      setResponseSuccess(
        selectedFiles.length > 0
          ? "Your additional information and photographs were submitted and attached to this report."
          : "Your additional information was submitted and attached to this report.",
      );
      window.dispatchEvent(new CustomEvent("reefcare:report-updated", {
        detail: { reportReference },
      }));
    } catch (requestError) {
      setResponseError(userFacingError(requestError, "Your response could not be submitted. Please try again."));
    } finally {
      setSubmittingResponse(false);
    }
  }

  if (state === "loading") {
    return <p>Loading report…</p>;
  }

  if (state === "error" || !report) {
    return <p role="alert">{error ?? "We couldn’t load this report right now."}</p>;
  }

  return (
    <section className={styles.detail} aria-labelledby="report-overview-heading">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Observation summary</p>
          <h2 id="report-overview-heading">What you reported</h2>
        </div>
        <span className={styles.statusChip}>{report.statusLabel}</span>
      </header>

      <dl className={styles.summary}>
        <div className={styles.row}>
          <dt>Possible threat type</dt>
          <dd>{report.threatCategory}</dd>
        </div>
        <div className={styles.row}>
          <dt>Location</dt>
          <dd>{report.diveSite ?? report.generalLocation}</dd>
        </div>
        <div className={styles.row}>
          <dt>Observed</dt>
          <dd>
            <time dateTime={report.observedAt}>{formatDateTime(new Date(report.observedAt))}</time>
          </dd>
        </div>
        {report.estimatedDepthMetres != null && (
          <div className={styles.row}>
            <dt>Estimated depth</dt>
            <dd>{report.estimatedDepthMetres} m</dd>
          </div>
        )}
      </dl>

      <section className={styles.descriptionBlock} aria-labelledby="observation-description-heading">
        <h3 id="observation-description-heading">Your observation</h3>
        <p className={styles.description}>{report.description}</p>
      </section>

      {report.preciseLocation?.latitude != null && report.preciseLocation?.longitude != null && (
        <div className={styles.locationNote}>
          <strong>Submitted location</strong>
          <p>
            {report.preciseLocation.latitude}, {report.preciseLocation.longitude}
            {report.preciseLocation.uncertaintyMetres != null &&
              ` (± ${report.preciseLocation.uncertaintyMetres} m)`}
          </p>
        </div>
      )}

      <details className={styles.structuredDetails}>
        <summary>Structured report details</summary>
        <dl>
          <div><dt>Estimated depth</dt><dd>{structuredDetails.estimated_depth_metres ?? (report.estimatedDepthMetres != null ? `${report.estimatedDepthMetres} m` : "Not included")}</dd></div>
          <div><dt>Approximate size</dt><dd>{structuredDetails.approximate_size ?? "Not included"}</dd></div>
          <div><dt>Coral interaction</dt><dd>{structuredDetails.coral_interaction ?? "Not included"}</dd></div>
          <div><dt>Marine-animal interaction</dt><dd>{structuredDetails.animal_interaction ?? "Not included"}</dd></div>
          <div><dt>Site reference</dt><dd>{structuredDetails.site_reference ?? "Not included"}</dd></div>
        </dl>
      </details>

      {(informationRequest?.reason || informationRequest?.requestReason || report.informationRequestReason) && (
        <section className={styles.infoRequest} aria-labelledby="information-request-heading">
          <h2 id="information-request-heading">More information needed</h2>
          <p>{informationRequest?.reason ?? informationRequest?.requestReason ?? report.informationRequestReason}</p>
          {informationRequest?.requestedAt && (
            <p className={styles.requestedAt}>Requested {formatDateTime(new Date(informationRequest.requestedAt))}</p>
          )}
          <form className={styles.responseForm} onSubmit={respondToRequest}>
            <label htmlFor="information-response">Additional details <span className={styles.optionalLabel}>Optional if adding photographs</span></label>
            <textarea
              id="information-response"
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              maxLength={4000}
              disabled={submittingResponse}
              aria-invalid={Boolean(responseError)}
              placeholder="Add the details requested above."
            />
            <small>{responseText.length}/4000 characters</small>

            <section
              className={styles.responseEvidence}
              aria-labelledby="additional-photographs-heading"
              aria-busy={submittingResponse}
            >
              <h3 id="additional-photographs-heading">
                Additional photographs <span className={styles.optionalLabel}>Optional</span>
              </h3>
              <p>Attach clearer or wider photographs if they help answer the Coordinator’s request.</p>
              <p className={styles.evidenceNote}>PNG, JPG or WebP. Maximum 10 MB each, up to 5 photographs.</p>
              <input
                className={styles.fileInput}
                id="information-response-photos"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                disabled={submittingResponse}
                onChange={chooseResponsePhotos}
              />
              <label className={styles.uploadButton} htmlFor="information-response-photos">Choose photographs</label>
              {responsePhotoMessage && <p className={styles.photoMessage} role="status">{responsePhotoMessage}</p>}
              {responsePhotos.length > 0 && (
                <div className={styles.responsePhotoGrid}>
                  {responsePhotos.map((photo) => (
                    <article className={styles.responsePhotoCard} key={photo.id}>
                      <Image
                        className={styles.responsePhotoPreview}
                        src={photo.previewUrl}
                        alt={`Selected additional evidence: ${photo.file.name}`}
                        width={180}
                        height={120}
                        unoptimized
                      />
                      <div>
                        <strong title={photo.file.name}>{photo.file.name}</strong>
                        <span>{formatFileSize(photo.file.size)}</span>
                        <button type="button" onClick={() => removeResponsePhoto(photo.id)} aria-label={`Remove ${photo.file.name}`}>Remove</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            {responseError && <p className={styles.responseError} role="alert">{responseError}</p>}
            <button type="submit" disabled={submittingResponse}>
              {submittingResponse ? "Submitting…" : "Submit additional information"}
            </button>
          </form>
        </section>
      )}

      {responseSuccess && <p className={styles.responseSuccess} role="status">{responseSuccess}</p>}

      {report.closure && (
        <section className={styles.closure} aria-labelledby="report-outcome-heading">
          <h2 id="report-outcome-heading">Outcome</h2>
          <p>
            <strong>{report.closure.closureLabel}</strong>
            {report.closure.publicNote && ` — ${report.closure.publicNote}`}
          </p>
        </section>
      )}
    </section>
  );
}
