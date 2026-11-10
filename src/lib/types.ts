export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  replayTimestamp: number; // in seconds
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  startSeconds: number;
  endSeconds: number;
  videoId: string;
  completed?: boolean;
  skipped?: boolean;
  notes: string;
  keyTakeaways: string[];
  quizzes: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface DailySchedule {
  dayNumber: number;
  dateLabel?: string;
  estimatedMinutes: number;
  lessonIds: string[];
}

export interface PlacementQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  associatedLessonIds: string[]; // Lessons user can skip if correct
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: string;
  sourceUrl: string;
  originalVideoId: string;
  totalDurationSeconds: number;
  dailyCommitmentMinutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  modules: Module[];
  schedule: DailySchedule[];
  placementTest: PlacementQuestion[];
  createdAt: string;
}

export interface CourseProgress {
  completedLessonIds: string[];
  skippedLessonIds: string[];
  quizScores: Record<string, number>; // lessonId -> score percentage
  placementTestScore?: number;
  currentLessonId?: string;
}
