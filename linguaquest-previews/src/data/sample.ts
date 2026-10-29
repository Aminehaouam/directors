/**
 * Shared mock content. Every visual direction renders exactly this data so the
 * comparison is about style, not content.
 */

export const app = {
  name: 'LinguaQuest',
  learner: 'Alex',
  language: 'French',
  languageCode: 'FR',
  level: 'Beginner',
  unit: 'Unit 1 · First conversations',
  destination: 'Paris',
  primaryAction: 'Continue learning',
  secondaryAction: 'Review vocabulary',
} as const;

export const initialStats = {
  streak: 3,
  gems: 125,
  lessonsToday: 2,
  dailyGoal: 5,
} as const;

/** Gems granted when a sample lesson is completed. */
export const LESSON_REWARD = 15;

export interface Milestone {
  id: string;
  number: number;
  title: string;
  /** Destination on the road to Paris; directions may use it as a landmark name. */
  place: string;
  placeEn: string;
  minutes: number;
  words: string[];
}

export const milestones: Milestone[] = [
  { id: 'm1', number: 1, title: 'First words', place: 'Le Port', placeEn: 'The harbor', minutes: 5, words: ['Oui', 'Non'] },
  { id: 'm2', number: 2, title: 'Sounds of French', place: 'Le Village', placeEn: 'The village', minutes: 6, words: ['Au revoir'] },
  { id: 'm3', number: 3, title: 'Greetings and introductions', place: 'Le Marché', placeEn: 'The market', minutes: 8, words: ['Bonjour', 'Salut', 'Merci'] },
  { id: 'm4', number: 4, title: 'At the café', place: 'Le Café', placeEn: 'The café', minutes: 8, words: ['Un café', "S'il vous plaît"] },
  { id: 'm5', number: 5, title: 'Numbers 1–10', place: 'La Gare', placeEn: 'The station', minutes: 7, words: ['Un', 'Deux', 'Trois'] },
  { id: 'm6', number: 6, title: 'Checkpoint: Paris', place: 'Paris', placeEn: 'Unit checkpoint', minutes: 10, words: [] },
];

/** Milestones completed before the prototype session starts. */
export const INITIAL_COMPLETED = 2;

export interface Vocab {
  id: string;
  fr: string;
  en: string;
  say: string;
  note: string;
  /** 0–4 memory strength */
  strength: number;
  featured: boolean;
}

export const vocabulary: Vocab[] = [
  { id: 'v1', fr: 'Bonjour', en: 'Hello / Good morning', say: 'bohn-ZHOOR', note: 'Polite with anyone, any time before evening.', strength: 3, featured: true },
  { id: 'v2', fr: 'Salut', en: 'Hi / Bye (casual)', say: 'sah-LOO', note: 'For friends and people your age.', strength: 2, featured: true },
  { id: 'v3', fr: 'Merci', en: 'Thank you', say: 'mair-SEE', note: 'Add “beaucoup” for “thanks a lot”.', strength: 4, featured: true },
  { id: 'v4', fr: 'Au revoir', en: 'Goodbye', say: 'oh ruh-VWAHR', note: 'The safe, polite goodbye.', strength: 2, featured: false },
  { id: 'v5', fr: 'Oui', en: 'Yes', say: 'wee', note: 'Short and sweet.', strength: 4, featured: false },
  { id: 'v6', fr: 'Non', en: 'No', say: 'nohn', note: 'Nasal “n” — don’t fully close it.', strength: 3, featured: false },
];

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  instruction: string;
  /** The French (or English) focus phrase shown large. */
  focus: string;
  focusLang: 'fr' | 'en';
  options: QuestionOption[];
  answerId: string;
  explain: string;
}

export const sampleLesson: Question[] = [
  {
    id: 'q1',
    instruction: 'What does this mean?',
    focus: 'Bonjour',
    focusLang: 'fr',
    options: [
      { id: 'a', label: 'Hello' },
      { id: 'b', label: 'Thank you' },
      { id: 'c', label: 'Goodbye' },
    ],
    answerId: 'a',
    explain: '“Bonjour” is the everyday, polite hello.',
  },
  {
    id: 'q2',
    instruction: 'Pick the casual way to say hi',
    focus: 'Hi!',
    focusLang: 'en',
    options: [
      { id: 'a', label: 'Merci' },
      { id: 'b', label: 'Salut' },
      { id: 'c', label: 'Bonsoir' },
    ],
    answerId: 'b',
    explain: '“Salut” is relaxed — perfect with friends.',
  },
  {
    id: 'q3',
    instruction: 'How do you say this in French?',
    focus: 'Thank you',
    focusLang: 'en',
    options: [
      { id: 'a', label: 'Salut' },
      { id: 'b', label: 'Merci' },
      { id: 'c', label: 'Bonjour' },
    ],
    answerId: 'b',
    explain: '“Merci” — and “merci beaucoup” for extra thanks.',
  },
];

export interface DayActivity {
  day: string;
  short: string;
  lessons: number | null; // null = future
  isToday?: boolean;
}

/** Week of Oct 26 2026. Streak covers Tue–Thu; Thursday's count is live. */
export const week: DayActivity[] = [
  { day: 'Monday', short: 'M', lessons: 0 },
  { day: 'Tuesday', short: 'T', lessons: 4 },
  { day: 'Wednesday', short: 'W', lessons: 3 },
  { day: 'Thursday', short: 'T', lessons: 2, isToday: true },
  { day: 'Friday', short: 'F', lessons: null },
  { day: 'Saturday', short: 'S', lessons: null },
  { day: 'Sunday', short: 'S', lessons: null },
];

/** Lessons finished before today; total = this + lessonsToday. */
export const LESSONS_BEFORE_TODAY = 7;
export const WORDS_LEARNED = 18;

export interface Badge {
  id: string;
  name: string;
  detail: string;
  earned: boolean;
}

export const badges: Badge[] = [
  { id: 'b1', name: 'First Steps', detail: 'Finished your first lesson', earned: true },
  { id: 'b2', name: 'On Fire', detail: '3-day streak', earned: true },
  { id: 'b3', name: 'Word Collector', detail: 'Learn 25 words', earned: false },
  { id: 'b4', name: 'Café Regular', detail: 'Finish “At the café”', earned: false },
];

export const profile = {
  handle: '@alex.learns',
  joined: 'Joined October 2026',
  goalLabel: '5 lessons a day',
  reminder: 'Daily reminder · 8:00',
} as const;
