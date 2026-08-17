import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language, PunchType, PunchData, Target, WorkoutStats, UserProfile, LevelData, AppState } from '../types';

const generateLevels = (): LevelData[] => {
  const levels: LevelData[] = [];
  for (let i = 1; i <= 100; i++) {
    const techniques: PunchType[] = [];
    if (i >= 1) techniques.push('jab');
    if (i >= 1) techniques.push('cross');
    if (i >= 10) techniques.push('hook');
    if (i >= 20) techniques.push('uppercut');

    const comboPattern: PunchType[] = [];
    if (i <= 10) {
      comboPattern.push(techniques[Math.floor(Math.random() * techniques.length)]);
    } else if (i <= 30) {
      for (let j = 0; j < 2; j++) comboPattern.push(techniques[Math.floor(Math.random() * techniques.length)]);
    } else if (i <= 60) {
      for (let j = 0; j < 3; j++) comboPattern.push(techniques[Math.floor(Math.random() * techniques.length)]);
    } else {
      for (let j = 0; j < 4; j++) comboPattern.push(techniques[Math.floor(Math.random() * techniques.length)]);
    }

    const difficulty = Math.min(10, 1 + Math.floor((i - 1) / 10));
    const mittSpeed = Math.max(800, 2000 - (i * 12));
    const hitWindow = Math.max(150, 400 - (i * 2.5));

    levels.push({
      id: i,
      name: `Level ${i}`,
      description: `Boxing training level ${i}`,
      difficulty,
      mittSpeed,
      hitWindow,
      comboPattern,
      techniques,
      stars: 0,
      unlocked: i === 1,
      bestScore: 0,
    });
  }
  return levels;
};

const defaultUser: UserProfile = {
  id: crypto.randomUUID(),
  name: 'Boxer',
  language: 'en',
  totalWorkouts: 0,
  totalPunches: 0,
  totalCalories: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastWorkoutDate: '',
  levelsCompleted: new Set<number>(),
  settings: {
    soundEnabled: true,
    cameraMirror: true,
    difficultyOffset: 0,
  },
};

const defaultStats: WorkoutStats = {
  totalPunches: 0,
  accuratePunches: 0,
  accuracy: 0,
  calories: 0,
  duration: 0,
  combosCompleted: 0,
  maxCombo: 0,
  punchesByType: { jab: 0, cross: 0, hook: 0, uppercut: 0 },
};

const calculateCalories = (punches: number, duration: number): number => {
  const baseRate = 6;
  const punchBonus = punches * 0.01;
  return Math.round((baseRate * duration / 60) + punchBonus);
};

const updateStreak = (user: UserProfile | null): UserProfile | null => {
  if (!user) return null;
  const today = new Date().toISOString().split('T')[0];
  const lastWorkout = user.lastWorkoutDate;

  if (!lastWorkout) {
    return { ...user, currentStreak: 1, longestStreak: Math.max(user.longestStreak, 1), lastWorkoutDate: today };
  }

  const lastWorkoutDate = new Date(lastWorkout);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    const newStreak = user.currentStreak + 1;
    return { ...user, currentStreak: newStreak, longestStreak: Math.max(user.longestStreak, newStreak), lastWorkoutDate: today };
  } else if (diffDays === 0) {
    return user;
  } else {
    return { ...user, currentStreak: 1, lastWorkoutDate: today };
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cameraActive: false,
      trackingActive: false,
      currentLevel: 1,
      levels: generateLevels(),
      currentTargets: [],
      currentCombo: null,
      score: 0,
      comboCounter: 0,
      timeRemaining: 60,
      workoutInProgress: false,
      paused: false,
      workoutStats: defaultStats,
      sessionPunches: [],
      user: defaultUser,
      language: 'en',
      showSettings: false,
      showSummary: false,
      showInstruction: false,
      currentInstruction: null,
      currentTip: '',

      setCameraActive: (active: boolean) => set({ cameraActive: active }),
      setTrackingActive: (active: boolean) => set({ trackingActive: active }),

      setCurrentLevel: (level: number) => {
        const levels = get().levels.map(l => l.id <= level ? { ...l, unlocked: true } : l);
        set({ currentLevel: level, levels });
      },

      addTarget: (target: Target) =>
        set((state) => ({ currentTargets: [...state.currentTargets, target] })),

      removeTarget: (id: string) =>
        set((state) => ({ currentTargets: state.currentTargets.filter(t => t.id !== id) })),

      updateTarget: (id: string, updates: Partial<Target>) =>
        set((state) => ({
          currentTargets: state.currentTargets.map(t => t.id === id ? { ...t, ...updates } : t)
        })),

      clearTargets: () => set({ currentTargets: [] }),

      setCurrentCombo: (combo: any) => set({ currentCombo: combo }),

      incrementScore: (points: number) => set((state) => ({ score: state.score + points })),

      incrementCombo: () => set((state) => ({ comboCounter: state.comboCounter + 1 })),

      resetCombo: () => set({ comboCounter: 0 }),

      setTimeRemaining: (time: number) => set({ timeRemaining: time }),

      decrementTime: () => set((state) => ({ timeRemaining: Math.max(0, state.timeRemaining - 1) })),

      startWorkout: (level: number) => {
        set({
          workoutInProgress: true,
          paused: false,
          currentLevel: level,
          score: 0,
          comboCounter: 0,
          currentTargets: [],
          sessionPunches: [],
          workoutStats: defaultStats,
        });
      },

      endWorkout: () => {
        const { sessionPunches, timeRemaining, user, currentLevel } = get();
        const duration = 60 - timeRemaining;

        const accuratePunches = sessionPunches.filter(p => p.hitTarget).length;
        const accuracy = sessionPunches.length > 0
          ? Math.round((accuratePunches / sessionPunches.length) * 100)
          : 0;
        const calories = calculateCalories(sessionPunches.length, duration);

        const punchesByType: Record<PunchType, number> = { jab: 0, cross: 0, hook: 0, uppercut: 0 };
        sessionPunches.forEach(p => {
          punchesByType[p.type] = (punchesByType[p.type] || 0) + 1;
        });

        const workoutStats: WorkoutStats = {
          totalPunches: sessionPunches.length,
          accuratePunches,
          accuracy,
          calories,
          duration,
          combosCompleted: 0,
          maxCombo: get().comboCounter,
          punchesByType,
        };

        const updatedUser = user ? {
          ...user,
          totalWorkouts: user.totalWorkouts + 1,
          totalPunches: user.totalPunches + sessionPunches.length,
          totalCalories: user.totalCalories + calories,
          levelsCompleted: new Set(user.levelsCompleted).add(currentLevel),
          ...updateStreak(user),
        } : defaultUser;

        const levels = get().levels.map(l => {
          if (l.id === currentLevel) {
            const stars = Math.min(3, Math.floor(workoutStats.accuracy / 33));
            return { ...l, stars: Math.max(l.stars, stars), bestScore: Math.max(l.bestScore, get().score), unlocked: true };
          }
          return l;
        });

        set({ workoutInProgress: false, showSummary: true, workoutStats, user: updatedUser, levels });
      },

      pauseWorkout: () => set({ paused: true }),
      resumeWorkout: () => set({ paused: false }),

      addPunch: (punch: PunchData) =>
        set((state) => ({
          sessionPunches: [...state.sessionPunches, punch],
          workoutStats: {
            ...state.workoutStats,
            totalPunches: state.workoutStats.totalPunches + 1,
            punchesByType: {
              ...state.workoutStats.punchesByType,
              [punch.type]: (state.workoutStats.punchesByType[punch.type] || 0) + 1,
            },
          },
        })),

      setLanguage: (lang: Language) => {
        set({ language: lang });
        if (get().user) {
          set((state) => ({ user: { ...state.user!, language: lang } }));
        }
      },

      setShowSettings: (show: boolean) => set({ showSettings: show }),
      setShowSummary: (show: boolean) => set({ showSummary: show }),
      setShowInstruction: (show: boolean) => set({ showInstruction: show }),
      setCurrentInstruction: (punch: PunchType | null) => set({ currentInstruction: punch }),
      setCurrentTip: (tip: string) => set({ currentTip: tip }),

      setUser: (user: UserProfile) => set({ user }),

      resetProgress: () => {
        set({ user: defaultUser, levels: generateLevels(), currentLevel: 1 });
      },
    }),
    {
      name: 'boxing-trainer-storage',
      partialize: (state) => ({
        user: state.user,
        levels: state.levels,
        currentLevel: state.currentLevel,
        language: state.language,
      }),
    }
  )
);

export default useStore;
