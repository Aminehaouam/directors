/**
 * Prototype state shared by every visual direction. Pure reducer + selectors:
 * the designs only render a `PreviewModel` and call its actions, so the four
 * styles behave identically and can be compared fairly.
 */
import {
  INITIAL_COMPLETED,
  LESSON_REWARD,
  initialStats,
  milestones,
  sampleLesson,
  type Milestone,
  type Question,
} from '../data/sample';

export type TabId = 'learn' | 'practice' | 'progress' | 'profile';
export type MilestoneStatus = 'completed' | 'current' | 'locked';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'practice', label: 'Practice' },
  { id: 'progress', label: 'Progress' },
  { id: 'profile', label: 'Profile' },
];

export interface LessonSession {
  milestoneId: string;
  step: number;
  picked: string | null;
  checked: boolean;
  correct: number;
  /** Set once the last question is answered and rewards are applied. */
  result: null | {
    gemsEarned: number;
    lessonsBefore: number;
    advancedPath: boolean;
  };
}

export interface PreviewState {
  tab: TabId;
  selectedId: string;
  completed: number;
  lessonsToday: number;
  gems: number;
  streak: number;
  lesson: LessonSession | null;
}

export type Action =
  | { type: 'tab'; tab: TabId }
  | { type: 'select'; id: string }
  | { type: 'start'; id?: string }
  | { type: 'pick'; optionId: string }
  | { type: 'check' }
  | { type: 'next' }
  | { type: 'exit' }
  | { type: 'reset' };

export const initialState: PreviewState = {
  tab: 'learn',
  selectedId: milestones[INITIAL_COMPLETED].id,
  completed: INITIAL_COMPLETED,
  lessonsToday: initialStats.lessonsToday,
  gems: initialStats.gems,
  streak: initialStats.streak,
  lesson: null,
};

export function statusOf(index: number, completed: number): MilestoneStatus {
  if (index < completed) return 'completed';
  if (index === completed) return 'current';
  return 'locked';
}

export function reducer(state: PreviewState, action: Action): PreviewState {
  switch (action.type) {
    case 'tab':
      return { ...state, tab: action.tab, lesson: null };
    case 'select':
      return { ...state, selectedId: action.id };
    case 'start': {
      const id = action.id ?? state.selectedId;
      const index = milestones.findIndex((m) => m.id === id);
      if (index < 0 || statusOf(index, state.completed) === 'locked') return state;
      return {
        ...state,
        tab: 'learn',
        selectedId: id,
        lesson: { milestoneId: id, step: 0, picked: null, checked: false, correct: 0, result: null },
      };
    }
    case 'pick':
      if (!state.lesson || state.lesson.checked || state.lesson.result) return state;
      return { ...state, lesson: { ...state.lesson, picked: action.optionId } };
    case 'check': {
      const lesson = state.lesson;
      if (!lesson || !lesson.picked || lesson.checked) return state;
      const right = lesson.picked === sampleLesson[lesson.step].answerId;
      return { ...state, lesson: { ...lesson, checked: true, correct: lesson.correct + (right ? 1 : 0) } };
    }
    case 'next': {
      const lesson = state.lesson;
      if (!lesson || !lesson.checked) return state;
      if (lesson.step < sampleLesson.length - 1) {
        return { ...state, lesson: { ...lesson, step: lesson.step + 1, picked: null, checked: false } };
      }
      // Last question answered: apply rewards and advance the path.
      const index = milestones.findIndex((m) => m.id === lesson.milestoneId);
      const advancedPath = index === state.completed && index < milestones.length - 1;
      const completed = advancedPath ? state.completed + 1 : state.completed;
      return {
        ...state,
        completed,
        selectedId: advancedPath ? milestones[completed].id : state.selectedId,
        gems: state.gems + LESSON_REWARD,
        lessonsToday: state.lessonsToday + 1,
        lesson: { ...lesson, result: { gemsEarned: LESSON_REWARD, lessonsBefore: state.lessonsToday, advancedPath } },
      };
    }
    case 'exit':
      return { ...state, lesson: null };
    case 'reset':
      return initialState;
  }
}

export interface MilestoneView extends Milestone {
  index: number;
  status: MilestoneStatus;
  selected: boolean;
}

export interface LessonView {
  session: LessonSession;
  milestone: Milestone;
  question: Question;
  total: number;
  /** Answer feedback for the current step, once checked. */
  verdict: null | 'correct' | 'wrong';
  answerLabel: string;
}

export interface PreviewModel {
  state: PreviewState;
  milestones: MilestoneView[];
  current: MilestoneView;
  selected: MilestoneView;
  dailyGoal: number;
  goalReached: boolean;
  lesson: LessonView | null;
  actions: {
    setTab: (tab: TabId) => void;
    select: (id: string) => void;
    start: (id?: string) => void;
    pick: (optionId: string) => void;
    check: () => void;
    next: () => void;
    exit: () => void;
    reset: () => void;
  };
}

export function buildModel(state: PreviewState, dispatch: (a: Action) => void): PreviewModel {
  const views: MilestoneView[] = milestones.map((m, index) => ({
    ...m,
    index,
    status: statusOf(index, state.completed),
    selected: m.id === state.selectedId,
  }));
  const current = views[Math.min(state.completed, views.length - 1)];
  const selected = views.find((v) => v.selected) ?? current;

  let lesson: LessonView | null = null;
  if (state.lesson) {
    const question = sampleLesson[state.lesson.step];
    const verdict = state.lesson.checked ? (state.lesson.picked === question.answerId ? 'correct' : 'wrong') : null;
    lesson = {
      session: state.lesson,
      milestone: milestones.find((m) => m.id === state.lesson!.milestoneId)!,
      question,
      total: sampleLesson.length,
      verdict,
      answerLabel: question.options.find((o) => o.id === question.answerId)!.label,
    };
  }

  return {
    state,
    milestones: views,
    current,
    selected,
    dailyGoal: initialStats.dailyGoal,
    goalReached: state.lessonsToday >= initialStats.dailyGoal,
    lesson,
    actions: {
      setTab: (tab) => dispatch({ type: 'tab', tab }),
      select: (id) => dispatch({ type: 'select', id }),
      start: (id) => dispatch({ type: 'start', id }),
      pick: (optionId) => dispatch({ type: 'pick', optionId }),
      check: () => dispatch({ type: 'check' }),
      next: () => dispatch({ type: 'next' }),
      exit: () => dispatch({ type: 'exit' }),
      reset: () => dispatch({ type: 'reset' }),
    },
  };
}
