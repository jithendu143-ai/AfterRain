import { createSeedData } from './seed';
import type { AppData } from '../domain/types';

const STORAGE_KEY = 'afterrain-kerala-v2';

export interface InitialDataResult {
  data: AppData;
  seeded: boolean;
  storageError?: string;
}

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppData>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.reports) && Array.isArray(candidate.incidents) && Array.isArray(candidate.relationships) && Array.isArray(candidate.tasks) && Array.isArray(candidate.history);
}

export function loadInitialData(): InitialDataResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppData(parsed)) return { data: parsed, seeded: false };
    }
    const data = createSeedData();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { data, seeded: true };
  } catch (error) {
    const data = createSeedData();
    const reason = error instanceof Error ? error.message : 'Browser storage is unavailable.';
    return { data, seeded: true, storageError: `Data is currently in memory only because browser storage could not be read or initialized: ${reason}` };
  }
}

export function saveAppData(data: AppData): string | undefined {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return undefined;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Browser storage quota or access error.';
    return `Changes were not saved to browser storage: ${reason}. Reduce photo sizes or export your data before trying again.`;
  }
}
