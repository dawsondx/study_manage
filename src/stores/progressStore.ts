import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudyRecord, StudySession } from '../types';

interface ProgressStore {
  studyRecords: StudyRecord[];
  currentSession?: StudySession;
  startStudySession: (resourceId: string) => void;
  endStudySession: (notes: string, progress: number) => void;
  pauseStudySession: () => void;
  resumeStudySession: () => void;
  getResourceProgress: (resourceId: string) => StudyRecord[];
  getTotalStudyTime: (resourceId?: string) => number;
  getStudyStatistics: (resourceId?: string) => {
    totalSessions: number;
    totalTime: number;
    averageSessionDuration: number;
    lastStudyDate?: Date;
  };
  isStudying: () => boolean;
  getCurrentSessionDuration: () => number;
  clearAllData: () => void;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      studyRecords: [],
      currentSession: undefined,

      startStudySession: (resourceId) => {
        const newSession: StudySession = {
          id: Date.now().toString(),
          resourceId,
          startTime: new Date(),
          currentProgress: 0,
          isPaused: false,
          totalPausedMs: 0
        };
        
        set({ currentSession: newSession });
      },

      endStudySession: (notes, progress) => {
        const { currentSession } = get();
        
        if (!currentSession) {
          return;
        }

        const endTime = new Date();
        const pausedMs = currentSession.totalPausedMs || 0;
        const duration = Math.round(((endTime.getTime() - currentSession.startTime.getTime()) - pausedMs) / 60000); // 转换为分钟
        
        const studyRecord: StudyRecord = {
          id: Date.now().toString(),
          resourceId: currentSession.resourceId,
          startTime: currentSession.startTime,
          endTime,
          duration,
          notes,
          progressBefore: currentSession.currentProgress,
          progressAfter: progress,
          createdAt: new Date()
        };

        set((state) => ({
          studyRecords: [...state.studyRecords, studyRecord],
          currentSession: undefined
        }));
      },

      pauseStudySession: () => {
        const { currentSession } = get();
        if (!currentSession || currentSession.isPaused) return;
        set({ currentSession: { ...currentSession, isPaused: true, pausedAt: new Date() } });
      },

      resumeStudySession: () => {
        const { currentSession } = get();
        if (!currentSession || !currentSession.isPaused || !currentSession.pausedAt) return;
        const now = new Date();
        const addedMs = now.getTime() - currentSession.pausedAt.getTime();
        const totalPausedMs = (currentSession.totalPausedMs || 0) + addedMs;
        set({ currentSession: { ...currentSession, isPaused: false, pausedAt: undefined, totalPausedMs } });
      },

      getResourceProgress: (resourceId) => {
        const { studyRecords } = get();
        return studyRecords
          .filter((record) => record.resourceId === resourceId)
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      },

      getTotalStudyTime: (resourceId) => {
        const { studyRecords } = get();
        const records = resourceId 
          ? studyRecords.filter((record) => record.resourceId === resourceId)
          : studyRecords;
        
        return records.reduce((total, record) => total + record.duration, 0);
      },

      getStudyStatistics: (resourceId) => {
        const { studyRecords } = get();
        const records = resourceId 
          ? studyRecords.filter((record) => record.resourceId === resourceId)
          : studyRecords;

        if (records.length === 0) {
          return {
            totalSessions: 0,
            totalTime: 0,
            averageSessionDuration: 0
          };
        }

        const totalTime = records.reduce((total, record) => total + record.duration, 0);
        const averageSessionDuration = Math.round(totalTime / records.length);
        const lastStudyDate = records.length > 0 ? records[records.length - 1].startTime : undefined;

        return {
          totalSessions: records.length,
          totalTime,
          averageSessionDuration,
          lastStudyDate
        };
      },

      isStudying: () => {
        return get().currentSession !== undefined;
      },

      getCurrentSessionDuration: () => {
        const { currentSession } = get();
        if (!currentSession) {
          return 0;
        }
        const now = new Date().getTime();
        const pausedMs = currentSession.totalPausedMs || 0;
        const effectiveMs = (now - currentSession.startTime.getTime()) - pausedMs - (currentSession.isPaused && currentSession.pausedAt ? (now - currentSession.pausedAt.getTime()) : 0);
        return Math.max(0, Math.round(effectiveMs / 1000)); // 秒
      },

      clearAllData: () => {
        set({ studyRecords: [], currentSession: undefined });
      }
    }),
    {
      name: 'progress-store',
      partialize: (state) => ({
        studyRecords: state.studyRecords
      })
    }
  )
);