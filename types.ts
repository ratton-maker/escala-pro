export interface Employee {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface ShiftType {
  id: string;
  code: string; // Short code for display (e.g., "09-17", "FOLGA")
  label: string; // Full name
  color: string; // Background color class or hex
  textColor: string;
  isOffDay: boolean;
}

export interface ScheduleEntry {
  id: string;
  dateStr: string; // YYYY-MM-DD
  employeeId: string;
  shiftTypeId: string;
  note?: string; // For "diligências"
  isLocked?: boolean;
  isSwap?: boolean;
  isExchange?: boolean;
}

// Helper type for the state
export type ScheduleState = Record<string, ScheduleEntry[]>;

export interface Selection {
  dateStr: string;
  employeeId: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string; // ISO string
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SWAP' | 'GENERATE' | 'CLEAR';
  details: string; // Human readable description
}

export enum AppMode {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  SWAP = 'SWAP' // Mode where user clicks two cells to swap/exchange
}