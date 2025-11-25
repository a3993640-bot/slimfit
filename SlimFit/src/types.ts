
export type Gender = 'male' | 'female';
export type RouteType = 'aggressive' | 'gentle';

export interface UserProfile {
  userId: string; // Unique ID for sync
  name: string;
  avatar: string; // Data URL (Image) or Emoji
  gender: Gender;
  age: number;
  height: number; // cm
  startWeight: number; // kg
  currentWeight: number; // kg
  targetWeight: number; // kg
  startDate: string; // ISO Date
  planWeeks: number; // User defined duration in weeks
  route: RouteType; // Derived from planWeeks intensity
  coins: number;
  teamId?: string; // For social feature
}

export interface DailyLog {
  date: string; // ISO Date YYYY-MM-DD
  weight: number;
  photo?: string; // Data URL
  note?: string;
  reflection?: string; // Reason for weight gain/miss: 'overate' | 'no_exercise' | 'period' | 'other'
  isTargetMet: boolean; // Calculated at time of log
}

// Real-time Teammate Data
export interface Teammate {
  userId: string;
  name: string;
  avatar: string;
  status: 'pending' | 'success' | 'fail';
  weightLost: number;
  lastSeen: number; // Timestamp
}

export interface ChatMessage {
  id: string;
  userId: string | 'system';
  userName: string;
  avatar?: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface AppState {
  hasOnboarded: boolean;
  showConfetti: boolean;
}

// Browser native install prompt event
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
