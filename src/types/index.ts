export type Language = 'en' | 'ru' | 'uz';

export type PunchType = 'jab' | 'cross' | 'hook' | 'uppercut';

export type HandSide = 'left' | 'right';

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface PunchData {
  type: PunchType;
  hand: HandSide;
  speed: number;
  direction: Point;
  power: number;
  accuracy: number;
  timestamp: number;
  hitTarget: boolean;
  targetId?: string;
}

export interface Target {
  id: string;
  position: Point;
  size: number;
  type: PunchType;
  hand: HandSide;
  active: boolean;
  hit: boolean;
  spawnTime: number;
  expiryTime: number;
  angle?: number;
}

export interface ComboPattern {
  punches: { type: PunchType; hand: HandSide }[];
  currentIndex: number;
  completed: boolean;
}

export interface WorkoutStats {
  totalPunches: number;
  accuratePunches: number;
  accuracy: number;
  calories: number;
  duration: number;
  combosCompleted: number;
  maxCombo: number;
  punchesByType: Record<PunchType, number>;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  difficulty: number;
  mittSpeed: number;
  hitWindow: number;
  comboPattern: PunchType[];
  techniques: PunchType[];
  stars: number;
  unlocked: boolean;
  bestScore: number;
}

export interface UserProfile {
  id: string;
  name: string;
  language: Language;
  totalWorkouts: number;
  totalPunches: number;
  totalCalories: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string;
  levelsCompleted: Set<number>;
  settings: {
    soundEnabled: boolean;
    cameraMirror: boolean;
    difficultyOffset: number;
  };
}

export interface AppState {
  cameraActive: boolean;
  trackingActive: boolean;
  currentLevel: number;
  levels: LevelData[];
  currentTargets: Target[];
  currentCombo: ComboPattern | null;
  score: number;
  comboCounter: number;
  timeRemaining: number;
  workoutInProgress: boolean;
  paused: boolean;
  workoutStats: WorkoutStats;
  sessionPunches: PunchData[];
  user: UserProfile | null;
  language: Language;
  showSettings: boolean;
  showSummary: boolean;
  showInstruction: boolean;
  currentInstruction: PunchType | null;
  currentTip: string;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}
