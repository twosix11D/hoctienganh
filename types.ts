
export type AppView = 'home' | 'lesson' | 'profile';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type VoiceGender = 'male' | 'female';

export interface UserProfile {
  name: string;
  level: UserLevel;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  voiceGender: VoiceGender; // Added preference
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: string; // FontAwesome class
  isLocked: boolean;
  topics: string[]; // e.g., ["Ordering Food", "Greetings"]
}

// Updated to match the new conversational AI schema
export interface LessonResponse {
  reply: string;
  voice_script: string;
  correction?: string | null;
  next_question: string;
}

export interface Message {
    role: 'user' | 'model';
    text: string;
}

// UI Chat Entry
export interface ChatEntry {
  id: string;
  role: 'user' | 'model';
  text: string;
  correction?: string | null; // For model messages only
  audioScript?: string; // For re-playing audio
}

// Persistence Interface
export interface SavedLessonState {
  unitId: string;
  history: any[]; // Content[] from GenAI SDK (context)
  chatEntries: ChatEntry[]; // UI Display History
  progress: number;
  currentXP: number;
  hearts: number;
}
