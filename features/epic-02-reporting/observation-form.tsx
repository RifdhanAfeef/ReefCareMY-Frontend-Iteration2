"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { DisplayDateInput } from "@/components/forms/display-date-input";
import { useMockAppState } from "@/features/shared/mock-app-state";
import {
  isFutureDisplayDate,
  isValidDisplayDate,
} from "@/lib/format/date";
import { getThreatCategories } from "@/lib/api/referenceApi";
import { checkReportCompleteness } from "@/lib/api/reportsApi";
import { structureReportDescription } from "@/lib/api/smartReportApi";
import type { ReportCompletenessResponse, ThreatCategoryReference } from "@/lib/api/types";
import { userFacingError } from "@/lib/api/user-facing-error";
import { buildReportCompletenessPayload } from "./report-payload";
import { observationCompletenessDisplay } from "./completeness-display";
import { createPhotoId, loadDraftPhotos, saveDraftPhotos, type StoredDraftPhoto } from "./draft-storage";
import { readSelectedReefSite, type StoredReefSite } from "@/features/epic-02-reef-explorer/selected-site-storage";
import type { ReportDraft } from "./types";
import styles from "./reporting.module.css";

type PhotoPreview = StoredDraftPhoto & { previewUrl: string };
type FieldErrors = Partial<Record<"photos" | "threat" | "date" | "time" | "depth" | "description", string>>;
const allowedPhotoTypes = ["image/png", "image/jpeg", "image/webp"];
const maximumPhotoSize = 10 * 1024 * 1024;

function captureTimeCandidate(file: File) {
  if (!file.lastModified || file.lastModified > Date.now()) return null;
  return new Date(file.lastModified).toISOString();
}

function photoMetadata(photo: StoredDraftPhoto, existing?: ReportDraft["photos"][number]) {
  return {
    id: photo.id,
    name: photo.file.name,
    type: photo.file.type,
    size: photo.file.size,
    capturedAt: existing?.capturedAt ?? captureTimeCandidate(photo.file),
    capturedAtConfirmed: existing?.capturedAtConfirmed ?? false,
  };
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export function ObservationForm({ initialThreat }: { initialThreat?: string }) {
  const router = useRouter();
  const { reportDraft, locationDraft, updateReportDraft, saveReportDraft } = useMockAppState();
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadMessage, setUploadMessage] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<ThreatCategoryReference[]>([]);
  const [categoryLoadError, setCategoryLoadError] = useState("");
  const [selectedReefSite, setSelectedReefSite] = useState<StoredReefSite | null>(null);
  const previewUrls = useRef<string[]>([]);
  const initialPhotoMetadata = useRef(reportDraft.photos);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [completeness, setCompleteness] = useState<ReportCompletenessResponse | null>(null);
  const [completenessError, setCompletenessError] = useState("");
  const [checkingCompleteness, setCheckingCompleteness] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSelectedReefSite(readSelectedReefSite());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDraftPhotos()
      .then((stored) => {
        if (cancelled) return;
        const restored = stored.map((photo) => {
          const previewUrl = URL.createObjectURL(photo.file);
          previewUrls.current.push(previewUrl);
          return { ...photo, previewUrl };
        });
        setPhotos(restored);
        updateReportDraft({
          photos: stored.map((photo) => photoMetadata(
            photo,
            initialPhotoMetadata.current.find((item) => item.id === photo.id),
          )),
        });
      })
      .catch(() => setUploadMessage("Saved photos could not be restored in this browser. Please select them again."));
    return () => {
      cancelled = true;
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [updateReportDraft]);

  useEffect(() => {
    if (!initialThreat || reportDraft.threatCategoryCode || reportDraft.threatCategoryId) return;
    const matchedThreat = categoryOptions.find((category) => category.code === initialThreat);
    if (!matchedThreat) return;
    updateReportDraft({
      threatCategoryCode: matchedThreat.code,
      threatCategoryId: matchedThreat.threatCategoryId,
    });
  }, [categoryOptions, initialThreat, reportDraft.threatCategoryCode, reportDraft.threatCategoryId, updateReportDraft]);

  useEffect(() => {
    let cancelled = false;
    getThreatCategories()
      .then((categories) => {
        if (cancelled) return;
        setCategoryOptions(categories);
        const selected = categories.find((category) => category.code === reportDraft.threatCategoryCode);
        if (selected && reportDraft.threatCategoryId !== selected.threatCategoryId) {
          updateReportDraft({ threatCategoryId: selected.threatCategoryId });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setCategoryLoadError(userFacingError(error, "Threat categories are temporarily unavailable. Please try again."));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reportDraft.threatCategoryCode, reportDraft.threatCategoryId, updateReportDraft]);

  function updateField(changes: Partial<ReportDraft>, errorField?: keyof FieldErrors) {
    updateReportDraft(changes);
    setCompleteness(null);
    setCompletenessError("");
    if (errorField) setErrors((current) => ({ ...current, [errorField]: undefined }));
  }

  async function syncPhotos(next: PhotoPreview[]) {
    setPhotos(next);
    updateReportDraft({
      photos: next.map((photo) => photoMetadata(
        photo,
        reportDraft.photos.find((item) => item.id === photo.id),
      )),
    });
    setCompleteness(null);
    setCompletenessError("");
    await saveDraftPhotos(next.map(({ id, file }) => ({ id, file })));
  }

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const emptyFile = selected.find((file) => file.size === 0);
    const invalidType = selected.find((file) => !allowedPhotoTypes.includes(file.type));
    const tooLarge = selected.find((file) => file.size > maximumPhotoSize);
    if (emptyFile) { setUploadMessage(`${emptyFile.name} is empty. Choose a valid photograph.`); return; }
    if (invalidType) { setUploadMessage(`${invalidType.name} is not supported. Choose a PNG, JPG or WebP image.`); return; }
    if (tooLarge) { setUploadMessage(`${tooLarge.name} is larger than the 10 MB limit.`); return; }

    const existingIds = new Set(photos.map((photo) => photo.id));
    const additions = selected
      .map((file) => ({ id: createPhotoId(file), file }))
      .filter((photo) => !existingIds.has(photo.id))
      .map((photo) => {
        const previewUrl = URL.createObjectURL(photo.file);
        previewUrls.current.push(previewUrl);
        return { ...photo, previewUrl };
      });
    if (additions.length === 0) { setUploadMessage("Those photos are already attached to this draft."); return; }
    try {
      await syncPhotos([...photos, ...additions]);
      setErrors((current) => ({ ...current, photos: undefined }));
      setUploadMessage(`${additions.length} photo${additions.length === 1 ? "" : "s"} attached to this report draft.`);
    } catch {
      setUploadMessage("The photos could not be saved locally. Please try again.");
    }
  }

  async function removePhoto(id: string) {
    const removed = photos.find((photo) => photo.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    previewUrls.current = previewUrls.current.filter((url) => url !== removed?.previewUrl);
    await syncPhotos(photos.filter((photo) => photo.id !== id));
    setUploadMessage("Photo removed from the draft.");
  }

  function confirmCaptureTime(id: string, confirmed: boolean) {
    updateReportDraft({
      photos: reportDraft.photos.map((photo) => photo.id === id
        ? { ...photo, capturedAtConfirmed: confirmed }
        : photo),
    });
    setCompleteness(null);
  }

  async function runSmartStructuring() {
    if (!reportDraft.description.trim()) return;
    setAssistantBusy(true);
    setAssistantMessage("");
    try {
      const result = await structureReportDescription(reportDraft.description.trim());
      if (!result.available) {
        setAssistantMessage(result.message ?? "Smart Report Structuring is unavailable. Continue manually.");
        return;
      }
      updateReportDraft({
        aiSuggestions: result.suggestions.map((suggestion) => ({ ...suggestion, status: "unresolved" })),
      });
      if (result.missingFields.length > 0) {
        setAssistantMessage(`Consider adding: ${result.missingFields.join(", ")}.`);
      } else if (result.warnings.length > 0) {
        setAssistantMessage(result.warnings.join(" "));
      } else {
        setAssistantMessage("Suggestions are ready for your review.");
      }
    } catch (error) {
      setAssistantMessage(userFacingError(error, "Smart Report Structuring is unavailable. Continue manually."));
    } finally {
      setAssistantBusy(false);
    }
  }

  function updateSuggestion(index: number, changes: Partial<ReportDraft["aiSuggestions"][number]>) {
    updateReportDraft({
      aiSuggestions: (reportDraft.aiSuggestions ?? []).map((suggestion, suggestionIndex) =>
        suggestionIndex === index ? { ...suggestion, ...changes } : suggestion),
    });
    setCompleteness(null);
  }

  async function runCompletenessCheck() {
    setCheckingCompleteness(true);
    setCompletenessError("");
    try {
      setCompleteness(await checkReportCompleteness(buildReportCompletenessPayload(reportDraft, locationDraft, photos.length)));
    } catch (error) {
      setCompletenessError(userFacingError(error, "Completeness guidance is unavailable. You can continue filling the form manually."));
    } finally {
      setCheckingCompleteness(false);
    }
  }

  const completenessDisplay = completeness ? observationCompletenessDisplay(completeness) : null;

  function validate() {
    const nextErrors: FieldErrors = {};
    if (photos.length === 0) nextErrors.photos = "Attach at least one photo before continuing.";
    if (!reportDraft.threatCategoryCode || !reportDraft.threatCategoryId) nextErrors.threat = "Select the closest threat category.";
    if (!reportDraft.observationDate) nextErrors.date = "Enter the observation date.";
    else if (!isValidDisplayDate(reportDraft.observationDate)) nextErrors.date = "Choose a valid observation date.";
    else if (isFutureDisplayDate(reportDraft.observationDate)) nextErrors.date = "Observation date cannot be in the future.";
    if (!reportDraft.observationTime) nextErrors.time = "Enter the approximate observation time.";
    if (reportDraft.estimatedDepthMetres && Number(reportDraft.estimatedDepthMetres) < 0) nextErrors.depth = "Depth cannot be negative.";
    if (!reportDraft.description.trim()) nextErrors.description = "Describe what you observed.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function saveDraft() {
    saveReportDraft();
    setUploadMessage("Draft saved on this device. You can return and continue later.");
  }

  function continueToLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    saveReportDraft();
    router.push("/report-a-reef/location");
  }

  return (
    <form className={styles.formShell} onSubmit={continueToLocation} noValidate>
      {selectedReefSite && (
        <aside className={styles.selectedSiteNotice} aria-label="Selected reef site carried from Reef Explorer">
          <div>
            <strong>Selected from Reef Explorer</strong>
            <span>{selectedReefSite.name} · {selectedReefSite.publicAreaLabel}</span>
          </div>
          <p>You can confirm or change this named site in the location step.</p>
        </aside>
      )}
      <section className={styles.card}>
        <div className={styles.sectionHeader}>
          <div><h2>Observation details</h2><p>Record what you saw. Scientific identification is not required.</p></div>
          <span className={styles.requiredNote}>* Required</span>
        </div>

        <div className={styles.formGrid}>
          <section className={styles.uploadArea} aria-labelledby="photo-heading">
            <h3 id="photo-heading">Photographs *</h3>
            <p className={styles.supporting}>Attach PNG, JPG or WebP images. Maximum 10 MB per photo.</p>
            <div className={styles.uploadContent}>
              <input className={styles.fileInput} id="report-photos" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={choosePhotos} />
              <label className={styles.uploadLabel} htmlFor="report-photos">Choose photos</label>
              {errors.photos && <p className={styles.errorText} role="alert">{errors.photos}</p>}
              {uploadMessage && <p className={styles.muted} role="status">{uploadMessage}</p>}
              {photos.length > 0 && <div className={styles.photoGrid}>{photos.map((photo) => {
                const metadata = reportDraft.photos.find((item) => item.id === photo.id);
                return <article className={styles.photoCard} key={photo.id}>
                  <Image className={styles.photoImage} src={photo.previewUrl} alt={`Selected evidence: ${photo.file.name}`} width={360} height={220} unoptimized />
                  <div className={styles.photoMeta}><strong title={photo.file.name}>{photo.file.name}</strong><span>{formatFileSize(photo.file.size)}</span><button className={styles.textButton} type="button" onClick={() => removePhoto(photo.id)}>Remove</button></div>
                  {metadata?.capturedAt && <div className={styles.metadataPrompt}>
                    <strong>Possible photo time</strong>
                    <span>{new Date(metadata.capturedAt).toLocaleString()}</span>
                    <p>This comes from the file date. Confirm it only if it matches the dive.</p>
                    <div className={styles.compactActions}>
                      <button className={metadata.capturedAtConfirmed ? styles.selectedAction : styles.smallButton} type="button" onClick={() => confirmCaptureTime(photo.id, true)}>Use this time</button>
                      <button className={!metadata.capturedAtConfirmed ? styles.selectedAction : styles.smallButton} type="button" onClick={() => confirmCaptureTime(photo.id, false)}>Ignore</button>
                    </div>
                  </div>}
                </article>;
              })}</div>}
            </div>
          </section>

          <label className={styles.field}><span className={styles.fieldLabel}>Threat category *</span><select value={reportDraft.threatCategoryCode} disabled={categoryOptions.length === 0} onChange={(event) => { const selected = categoryOptions.find((category) => category.code === event.target.value); updateField({ threatCategoryCode: (selected?.code ?? "") as ReportDraft["threatCategoryCode"], threatCategoryId: selected?.threatCategoryId ?? null }, "threat"); }} aria-invalid={Boolean(errors.threat)}><option value="">{categoryOptions.length === 0 ? "Loading categories…" : "Select a category"}</option>{categoryOptions.map((category) => <option value={category.code} key={category.code}>{category.label}</option>)}</select>{categoryLoadError && <span className={styles.errorText} role="alert">{categoryLoadError}</span>}{errors.threat && <span className={styles.errorText} role="alert">{errors.threat}</span>}</label>
          <div className={styles.field}><span className={styles.fieldLabel}>Observation date *</span><DisplayDateInput label="Observation date" required value={reportDraft.observationDate} onChange={(value) => updateField({ observationDate: value }, "date")} invalid={Boolean(errors.date)} describedBy={errors.date ? "observation-date-error" : undefined} />{errors.date && <span className={styles.errorText} id="observation-date-error" role="alert">{errors.date}</span>}</div>
          <label className={styles.field}><span className={styles.fieldLabel}>Approximate observation time *</span><input type="time" value={reportDraft.observationTime} onChange={(event) => updateField({ observationTime: event.target.value }, "time")} aria-invalid={Boolean(errors.time)} />{errors.time && <span className={styles.errorText} role="alert">{errors.time}</span>}</label>
          <label className={styles.field}><span className={styles.fieldLabel}>Estimated depth in metres <span className={styles.fieldMeta}>Optional</span></span><input type="number" min="0" step="0.1" inputMode="decimal" placeholder="For example, 15" value={reportDraft.estimatedDepthMetres} onChange={(event) => updateField({ estimatedDepthMetres: event.target.value }, "depth")} aria-invalid={Boolean(errors.depth)} />{errors.depth && <span className={styles.errorText} role="alert">{errors.depth}</span>}</label>
          <label className={`${styles.field} ${styles.fullWidth}`}><span className={styles.fieldLabel}>Short description *</span><span className={styles.fieldHelp}>Describe only what you observed, including approximate size or interaction with coral when relevant.</span><textarea value={reportDraft.description} onChange={(event) => updateField({ description: event.target.value }, "description")} aria-invalid={Boolean(errors.description)} placeholder="Example: Large fishing net tangled around branching coral, roughly 15 m deep." />{errors.description && <span className={styles.errorText} role="alert">{errors.description}</span>}</label>
        </div>

        <section className={styles.assistantCard} aria-labelledby="smart-report-heading">
          <div className={styles.assistantHeader}><div><p className={styles.assistantLabel}>Optional AI assistance</p><h3 id="smart-report-heading">Smart Report Structuring</h3><p>Check your description for possible structured details. Nothing is accepted until you confirm it.</p></div><button className={styles.secondaryButton} type="button" disabled={assistantBusy || !reportDraft.description.trim()} onClick={runSmartStructuring}>{assistantBusy ? "Checking…" : "Check my description"}</button></div>
          {assistantMessage && <p className={styles.assistantMessage} role="status">{assistantMessage}</p>}
          {(reportDraft.aiSuggestions ?? []).length > 0 && <div className={styles.suggestionList}>{reportDraft.aiSuggestions.map((suggestion, index) => <article className={styles.suggestionRow} key={`${suggestion.field}-${index}`}>
            <div><span className={styles.aiBadge}>AI suggestion</span><strong>{suggestion.label}</strong></div>
            <input aria-label={`${suggestion.label} suggested value`} value={suggestion.suggestedValue ?? ""} disabled={suggestion.status === "removed"} onChange={(event) => updateSuggestion(index, { suggestedValue: event.target.value, status: "corrected" })} />
            <div className={styles.compactActions}>
              <button className={suggestion.status === "confirmed" ? styles.selectedAction : styles.smallButton} type="button" onClick={() => updateSuggestion(index, { status: "confirmed" })}>Confirm</button>
              <button className={suggestion.status === "removed" ? styles.selectedAction : styles.smallButton} type="button" onClick={() => updateSuggestion(index, { status: "removed" })}>Remove</button>
            </div>
            <span className={styles.suggestionStatus}>Status: {suggestion.status}</span>
          </article>)}</div>}
          <p className={styles.privacyNote}>Only the written description is sent for structuring. Photos and precise location are not sent to the AI service.</p>
        </section>

        <section className={styles.completenessCard} aria-labelledby="completeness-heading">
          <div><h3 id="completeness-heading">Report completeness</h3><p>Check required items and optional details that could help a coordinator.</p></div>
          <button className={styles.secondaryButton} type="button" disabled={checkingCompleteness} onClick={runCompletenessCheck}>{checkingCompleteness ? "Checking…" : "Check completeness"}</button>
          {completenessError && <p className={styles.errorText} role="alert">{completenessError}</p>}
          {completenessDisplay && <div className={styles.checkResults} role="status"><strong>{completenessDisplay.summary}</strong>{completenessDisplay.required.length > 0 && <div><span className={styles.requiredTag}>Required</span><p>{completenessDisplay.required.join(", ")}</p></div>}{completenessDisplay.recommended.length > 0 && <div><span className={styles.recommendedTag}>Recommended</span><p>{completenessDisplay.recommended.join(", ")}</p></div>}</div>}
        </section>

        <div className={styles.formFooter}>
          <div>{reportDraft.lastSavedAt ? <span className={styles.savedText}>Draft saved {reportDraft.lastSavedAt}</span> : <span className={styles.muted}>Draft details stay on this device.</span>}</div>
          <div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={saveDraft}>Save draft</button><button className={styles.primaryButton} type="submit">Continue to location</button></div>
        </div>
      </section>
    </form>
  );
}
