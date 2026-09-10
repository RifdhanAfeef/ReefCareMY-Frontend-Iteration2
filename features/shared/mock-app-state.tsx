"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cases as initialCases, currentCoordinatorName } from "@/features/epic-01-access/mock-data";
import type {
  CaseActivity,
  CaseRecord,
  LocationConfidenceCode,
} from "@/features/epic-01-access/types";
import type { ReportDraft } from "@/features/epic-02-reporting/types";
import { formatDateTime } from "@/lib/format/date";
import { useAuth } from "@/features/epic-01-access/auth-context";

export type LocationFlowStep =
  | "session"
  | "create"
  | "location"
  | "confirm"
  | "privacy"
  | "saved";

export type DiveSession = {
  id: string;
  backendId: number | null;
  namedDiveSiteId: number;
  site: string;
  label?: string;
  date?: string;
  start?: string;
  end?: string;
};

export type MapPin = {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

export type LocationDraft = {
  step: LocationFlowStep;
  sessions: DiveSession[];
  selectedSessionId: string;
  form: {
    site: string;
    label: string;
    date: string;
    start: string;
    end: string;
  };
  pin: MapPin | null;
  locationSource: "dive_site" | "map_pin" | "manual_coordinates";
  confidence: LocationConfidenceCode | "";
};

export const initialLocationDraft: LocationDraft = {
  step: "session",
  sessions: [],
  selectedSessionId: "",
  form: { site: "", label: "", date: "", start: "", end: "" },
  pin: null,
  locationSource: "dive_site",
  confidence: "",
};

export const initialReportDraft: ReportDraft = {
  threatCategoryCode: "",
  threatCategoryId: null,
  observationDate: "",
  observationTime: "",
  estimatedDepthMetres: "",
  description: "",
  photos: [],
  lastSavedAt: null,
};

type AppStateContextValue = {
  cases: CaseRecord[];
  currentCoordinator: string;
  locationDraft: LocationDraft;
  reportDraft: ReportDraft;
  findCase: (reportReference: string) => CaseRecord | undefined;
  claimCase: (reportReference: string) => boolean;
  updateCase: (
    reportReference: string,
    changes: Partial<CaseRecord>,
    activity?: Omit<CaseActivity, "id">,
  ) => void;
  updateLocationDraft: (changes: Partial<LocationDraft>) => void;
  updateReportDraft: (changes: Partial<ReportDraft>) => void;
  saveReportDraft: () => void;
  resetReportDraft: () => void;
  resetPrototypeData: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);
const storageKeyPrefix = "reefcare-my-iteration-1-state-v6";

export function accountDraftStorageKey(userId: number) {
  return `${storageKeyPrefix}:user:${userId}`;
}

export function MockAppStateProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [locationDraft, setLocationDraft] = useState<LocationDraft>(initialLocationDraft);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(initialReportDraft);
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  const activeStorageKey = status === "authenticated" && user
    ? accountDraftStorageKey(user.id)
    : null;

  useEffect(() => {
    if (status === "loading") return;
    let storedCases: CaseRecord[] | undefined;
    let storedLocationDraft: LocationDraft | undefined;
    let storedReportDraft: ReportDraft | undefined;
    try {
      const stored = activeStorageKey ? window.localStorage.getItem(activeStorageKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored) as {
          cases?: CaseRecord[];
          locationDraft?: LocationDraft;
          reportDraft?: ReportDraft;
        };
        if (Array.isArray(parsed.cases)) storedCases = parsed.cases;
        if (parsed.locationDraft) storedLocationDraft = parsed.locationDraft;
        if (parsed.reportDraft) storedReportDraft = parsed.reportDraft;
      }
    } catch {
      if (activeStorageKey) window.localStorage.removeItem(activeStorageKey);
    }
    const restoreTimer = window.setTimeout(() => {
      setCases(storedCases ?? initialCases);
      setLocationDraft(storedLocationDraft ?? initialLocationDraft);
      setReportDraft(storedReportDraft ?? initialReportDraft);
      setRestoredKey(activeStorageKey);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [activeStorageKey, status]);

  useEffect(() => {
    if (!activeStorageKey || restoredKey !== activeStorageKey) return;
    window.localStorage.setItem(activeStorageKey, JSON.stringify({ cases, locationDraft, reportDraft }));
  }, [activeStorageKey, cases, locationDraft, reportDraft, restoredKey]);

  const findCase = useCallback(
    (reportReference: string) =>
      cases.find(
        (item) =>
          item.reportReference.toLowerCase() === reportReference.toLowerCase(),
      ),
    [cases],
  );

  const updateCase = useCallback<AppStateContextValue["updateCase"]>(
    (reportReference, changes, activity) => {
      setCases((current) =>
        current.map((item) => {
          if (item.reportReference !== reportReference) return item;
          return {
            ...item,
            ...changes,
            activity: activity
              ? [
                  ...item.activity,
                  {
                    ...activity,
                    id: `ACT-${reportReference}-${Date.now()}`,
                  },
                ]
              : item.activity,
          };
        }),
      );
    },
    [],
  );

  const claimCase = useCallback(
    (reportReference: string) => {
      const record = cases.find((item) => item.reportReference === reportReference);
      if (!record || record.owner) return false;
      const claimedAt = formatDateTime();
      updateCase(
        reportReference,
        {
          owner: currentCoordinatorName,
          claimedAt,
          statusCode: "claimed",
          statusLabel: "Claimed",
        },
        { action: "Case claimed", actor: currentCoordinatorName, timestamp: claimedAt },
      );
      return true;
    },
    [cases, updateCase],
  );

  const updateLocationDraft = useCallback((changes: Partial<LocationDraft>) => {
    setLocationDraft((current) => ({ ...current, ...changes }));
  }, []);

  const updateReportDraft = useCallback((changes: Partial<ReportDraft>) => {
    setReportDraft((current) => ({ ...current, ...changes }));
  }, []);

  const saveReportDraft = useCallback(() => {
    setReportDraft((current) => ({ ...current, lastSavedAt: formatDateTime() }));
  }, []);

  const resetReportDraft = useCallback(() => {
    setReportDraft(initialReportDraft);
    setLocationDraft(initialLocationDraft);
  }, []);

  const resetPrototypeData = useCallback(() => {
    setCases(initialCases);
    setLocationDraft(initialLocationDraft);
    setReportDraft(initialReportDraft);
    if (activeStorageKey) window.localStorage.removeItem(activeStorageKey);
  }, [activeStorageKey]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      cases,
      currentCoordinator: currentCoordinatorName,
      locationDraft,
      reportDraft,
      findCase,
      claimCase,
      updateCase,
      updateLocationDraft,
      updateReportDraft,
      saveReportDraft,
      resetReportDraft,
      resetPrototypeData,
    }),
    [cases, locationDraft, reportDraft, findCase, claimCase, updateCase, updateLocationDraft, updateReportDraft, saveReportDraft, resetReportDraft, resetPrototypeData],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useMockAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useMockAppState must be used within MockAppStateProvider");
  }
  return context;
}
