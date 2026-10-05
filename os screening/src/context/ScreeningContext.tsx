// Screening session context
// Tracks the state of an in-progress screening for one patient
import React, { createContext, useContext, useState } from 'react';
import type { KOOSResponse } from '../data/koosQuestions';
import type { RiskFactorAnswers } from '../data/koosQuestions';
import type { FusionOutput } from '../engine/fusionEngine';

export type CardStatus = 'notStarted' | 'inProgress' | 'complete';
export type SyncStatus = 'savedLocally' | 'syncing' | 'synced';
export type TrackingQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'MANUAL';

export interface SitToStandData {
  reps: number;
  durationSeconds: number;
  cameraTracked: boolean;
  trackingQuality: TrackingQuality;
  entryMethod: 'camera' | 'manual';
}

export interface XrayData {
  uploaded: boolean;
  fileUrl?: string;
  klGrade?: number;
  uploadedAt?: Date;
}

export interface ScreeningSession {
  patientId: string;

  // Questionnaire
  questionnaireStatus: CardStatus;
  questionnaireSyncStatus: SyncStatus;
  koosResponses: Record<string, KOOSResponse>;
  riskFactors: RiskFactorAnswers;
  redFlagAnswer: boolean | null;

  // Sit-to-Stand
  stsStatus: CardStatus;
  stsSyncStatus: SyncStatus;
  stsData: SitToStandData | null;
  stsDisabledByRedFlag: boolean;

  // Results
  resultsStatus: CardStatus;
  fusionOutput: FusionOutput | null;

  // X-ray (optional)
  xrayData: XrayData;
}

const emptySession = (patientId: string): ScreeningSession => ({
  patientId,
  questionnaireStatus: 'notStarted',
  questionnaireSyncStatus: 'savedLocally',
  koosResponses: {},
  riskFactors: {},
  redFlagAnswer: null,
  stsStatus: 'notStarted',
  stsSyncStatus: 'savedLocally',
  stsData: null,
  stsDisabledByRedFlag: false,
  resultsStatus: 'notStarted',
  fusionOutput: null,
  xrayData: { uploaded: false },
});

interface ScreeningContextType {
  session: ScreeningSession | null;
  initSession: (patientId: string) => void;
  updateQuestionnaire: (
    responses: Record<string, KOOSResponse>,
    riskFactors: RiskFactorAnswers,
    redFlag: boolean,
    status: CardStatus
  ) => void;
  updateSTS: (data: SitToStandData, status: CardStatus) => void;
  setFusionOutput: (output: FusionOutput) => void;
  updateXray: (data: XrayData) => void;
  clearSession: () => void;
}

const ScreeningContext = createContext<ScreeningContextType>({
  session: null,
  initSession: () => {},
  updateQuestionnaire: () => {},
  updateSTS: () => {},
  setFusionOutput: () => {},
  updateXray: () => {},
  clearSession: () => {},
});

export function ScreeningProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ScreeningSession | null>(null);

  const initSession = (patientId: string) => {
    setSession(emptySession(patientId));
  };

  const updateQuestionnaire = (
    responses: Record<string, KOOSResponse>,
    riskFactors: RiskFactorAnswers,
    redFlag: boolean,
    status: CardStatus
  ) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            koosResponses: responses,
            riskFactors,
            redFlagAnswer: redFlag,
            questionnaireStatus: status,
            questionnaireSyncStatus: 'savedLocally',
            stsDisabledByRedFlag: redFlag,
            stsStatus: redFlag ? 'notStarted' : prev.stsStatus,
          }
        : prev
    );
  };

  const updateSTS = (data: SitToStandData, status: CardStatus) => {
    setSession((prev) =>
      prev ? { ...prev, stsData: data, stsStatus: status, stsSyncStatus: 'savedLocally' } : prev
    );
  };

  const setFusionOutput = (output: FusionOutput) => {
    setSession((prev) =>
      prev ? { ...prev, fusionOutput: output, resultsStatus: 'complete' } : prev
    );
  };

  const updateXray = (data: XrayData) => {
    setSession((prev) => (prev ? { ...prev, xrayData: data } : prev));
  };

  const clearSession = () => setSession(null);

  return (
    <ScreeningContext.Provider
      value={{ session, initSession, updateQuestionnaire, updateSTS, setFusionOutput, updateXray, clearSession }}
    >
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  return useContext(ScreeningContext);
}
