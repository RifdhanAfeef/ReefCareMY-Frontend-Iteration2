"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { DisplayDateInput } from "@/components/forms/display-date-input";
import {
  createConservationAction,
  getConservationActions,
  getConservationActionTypes,
} from "@/lib/api/coordinatorApi";
import type {
  ConservationAction,
  ConservationActionState,
  ConservationActionTypeOption,
} from "@/lib/api/types";
import { userFacingError } from "@/lib/api/user-facing-error";
import {
  displayDateToIsoDate,
  formatDateTime,
  isFutureDisplayDate,
  isValidDisplayDate,
} from "@/lib/format/date";
import styles from "./conservation-action.module.css";

const actionStateLabels: Record<ConservationActionState, string> = {
  action_planned: "Action planned — not completed",
  action_taken: "Action taken",
};

function displayCalendarDate(value: string | null) {
  if (!value) return "Not provided";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function displayCreatedAt(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : formatDateTime(parsed);
}

function ActionHistory({ actions }: { actions: ConservationAction[] }) {
  if (actions.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <strong>No conservation action has been recorded yet</strong>
        <p>Use the form to record a planned action or confirmed action taken.</p>
      </div>
    );
  }

  return (
    <ol className={styles.historyList} aria-label="Recorded conservation actions">
      {actions.map((action) => (
        <li className={styles.historyItem} key={action.caseActionId}>
          <div className={styles.historyHeading}>
            <div>
              <span className={styles[action.actionState]}>{actionStateLabels[action.actionState]}</span>
              <h3>{action.actionTypeLabel}</h3>
            </div>
            <time dateTime={action.createdAt}>{displayCreatedAt(action.createdAt)}</time>
          </div>
          <dl className={styles.actionDetails}>
            <div><dt>Action date</dt><dd>{displayCalendarDate(action.actionDate)}</dd></div>
            <div><dt>Responsible team</dt><dd>{action.responsibleTeam || "Not provided"}</dd></div>
            <div><dt>Recorded by</dt><dd>{action.createdByName || "Authorised coordinator"}</dd></div>
          </dl>
          {action.notes && <p className={styles.notes}>{action.notes}</p>}
          {action.actionState === "action_planned" && (
            <p className={styles.plannedReminder}>This is a plan only. It does not confirm that conservation work has happened.</p>
          )}
        </li>
      ))}
    </ol>
  );
}

export function ConservationActionPanel({ reportReference }: { reportReference: string }) {
  const [actionTypes, setActionTypes] = useState<ConservationActionTypeOption[]>([]);
  const [actions, setActions] = useState<ConservationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionState, setActionState] = useState<ConservationActionState>("action_planned");
  const [actionTypeCode, setActionTypeCode] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [responsibleTeam, setResponsibleTeam] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function retryLoad() {
    setLoading(true);
    setLoadError("");
    try {
      const [types, recorded] = await Promise.all([
        getConservationActionTypes(),
        getConservationActions(reportReference),
      ]);
      setActionTypes(types);
      setActions(recorded.items);
      setActionTypeCode((current) => current || types[0]?.code || "");
    } catch (requestError) {
      setLoadError(userFacingError(requestError, "Conservation actions could not be loaded. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getConservationActionTypes(),
      getConservationActions(reportReference),
    ]).then(([types, recorded]) => {
      if (cancelled) return;
      setActionTypes(types);
      setActions(recorded.items);
      setActionTypeCode((current) => current || types[0]?.code || "");
    }).catch((requestError) => {
      if (!cancelled) {
        setLoadError(userFacingError(requestError, "Conservation actions could not be loaded. Please try again."));
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [reportReference]);

  const selectedActionType = useMemo(
    () => actionTypes.find((item) => item.code === actionTypeCode) ?? null,
    [actionTypeCode, actionTypes],
  );

  async function saveAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!actionTypeCode) {
      setFormError("Choose an action type.");
      return;
    }
    if (!responsibleTeam.trim()) {
      setFormError("Enter the team responsible for this action.");
      return;
    }
    if (actionState === "action_taken" && !actionDate) {
      setFormError("Enter the date the action was taken.");
      return;
    }
    if (actionDate && !isValidDisplayDate(actionDate)) {
      setFormError("Enter a valid date in dd/mm/yyyy format.");
      return;
    }
    if (actionState === "action_taken" && isFutureDisplayDate(actionDate)) {
      setFormError("The date of a completed action cannot be in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await createConservationAction(reportReference, {
        actionTypeCode,
        actionState,
        actionDate: actionDate ? displayDateToIsoDate(actionDate) : null,
        responsibleTeam: responsibleTeam.trim(),
        notes: notes.trim() || null,
      });
      setActions((current) => [...current, saved]);
      setSuccessMessage(actionState === "action_taken"
        ? "The completed conservation action was recorded."
        : "The planned conservation action was recorded without marking it as completed.");
      setActionState("action_planned");
      setActionDate("");
      setResponsibleTeam("");
      setNotes("");
    } catch (requestError) {
      setFormError(userFacingError(requestError, "The conservation action could not be recorded. Please check the details and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="conservation-action-heading">
      <header className={styles.panelHeading}>
        <div>
          <p className={styles.eyebrow}>Conservation action</p>
          <h2 id="conservation-action-heading">Action record</h2>
        </div>
        <p>Record what is planned separately from what has actually happened.</p>
      </header>

      {loading && <div className={styles.loadingState} role="status">Loading conservation actions…</div>}
      {loadError && (
        <div className={styles.errorBox} role="alert">
          <strong>Actions unavailable</strong>
          <p>{loadError}</p>
          <button type="button" onClick={() => void retryLoad()}>Try again</button>
        </div>
      )}

      {!loading && !loadError && (
        <div className={styles.contentGrid}>
          <section className={styles.historySection} aria-labelledby="action-history-heading">
            <h3 id="action-history-heading">Case action history</h3>
            <ActionHistory actions={actions} />
          </section>

          <form className={styles.actionForm} onSubmit={saveAction} noValidate>
            <h3>Record an action update</h3>
            <p className={styles.formIntroduction}>Each update is added to this case history and does not replace earlier records.</p>

            <fieldset className={styles.stateOptions} disabled={submitting}>
              <legend>Action state</legend>
              <label>
                <input type="radio" name="actionState" value="action_planned" checked={actionState === "action_planned"} onChange={() => setActionState("action_planned")} />
                <span><strong>Action planned</strong><small>A future or intended response; no completion is claimed.</small></span>
              </label>
              <label>
                <input type="radio" name="actionState" value="action_taken" checked={actionState === "action_taken"} onChange={() => setActionState("action_taken")} />
                <span><strong>Action taken</strong><small>Use only when the work has actually occurred.</small></span>
              </label>
            </fieldset>

            <label className={styles.field}>
              <span>Action type *</span>
              <select value={actionTypeCode} onChange={(event) => setActionTypeCode(event.target.value)} disabled={submitting} required>
                <option value="">Select an action</option>
                {actionTypes.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
              {selectedActionType?.description && <small>{selectedActionType.description}</small>}
            </label>

            <div className={styles.field}>
              <span>{actionState === "action_taken" ? "Date action was taken *" : "Planned action date"}</span>
              <DisplayDateInput
                label={actionState === "action_taken" ? "Date action was taken" : "Planned action date"}
                value={actionDate}
                onChange={setActionDate}
                required={actionState === "action_taken"}
                allowFuture={actionState === "action_planned"}
                disabled={submitting}
              />
            </div>

            <label className={styles.field}>
              <span>Responsible team *</span>
              <input type="text" value={responsibleTeam} onChange={(event) => setResponsibleTeam(event.target.value)} maxLength={200} placeholder="For example, Tioman response team" disabled={submitting} required />
            </label>

            <label className={styles.field}>
              <span>Action notes</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} placeholder="Describe the planned or completed conservation work." disabled={submitting} />
              <small>{notes.length}/2000 characters</small>
            </label>

            <aside className={styles.evidenceNotice}>
              <strong>Supporting evidence</strong>
              <p>Supporting files cannot be attached to this action yet. Record any evidence reference in the notes for now.</p>
            </aside>

            {formError && <p className={styles.formError} role="alert">{formError}</p>}
            {successMessage && <p className={styles.successMessage} role="status">{successMessage}</p>}

            <button className={styles.submitButton} type="submit" disabled={submitting || actionTypes.length === 0}>
              {submitting ? "Recording action…" : "Record action update"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
