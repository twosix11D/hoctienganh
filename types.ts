
export type AppView = 'home' | 'lesson' | 'profile' | 'exercise';

export type UserLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Expanded Voice Personas
export type VoicePersona = 
    | 'male_child' | 'female_child' 
    | 'male_adult' | 'female_adult' 
    | 'male_elderly' | 'female_elderly';

export type VoiceGender = 'male' | 'female'; // Keep for backward compatibility if needed

export interface UserProfile {
  name: string;
  level: UserLevel;
  xp: number;
  streak: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  voiceGender: VoiceGender; 
  voicePersona: VoicePersona; 
  isMuted: boolean; // New: Mute state
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
  pronunciation_analysis?: string | null; // New: Specific feedback on pronunciation/grammar
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
  pronunciation_analysis?: string | null; // New: Feedback on user's previous turn
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

// --- EXERCISE TYPES ---

export type ExerciseLevel = 
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5'
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9'
  | 'Grade 10' | 'Grade 11' | 'Grade 12'
  | 'TOEIC' | 'University';

export interface ExerciseData {
  type: string;
  difficulty: string;
  topic: string;
  instruction: string;
  question: string;
  options?: string[]; // For multiple choice
  answer_key: string;
  example?: string;
}

export interface ExerciseResponse {
  exercise: ExerciseData;
}

export interface ExerciseEvaluation {
  isCorrect: boolean;
  explanation: string;
}
