import type { Timestamp } from "firebase/firestore"
import type { MuscleGroup } from "./common.types"

// ─── Exercise ─────────────────────────────────────────────────────
export interface Exercise {
  id:                string
  name:              string
  category:          ExerciseCategory
  muscleGroups:      MuscleGroup[]
  secondaryMuscles?: MuscleGroup[]
  equipment:         Equipment[]
  mechanics?:        "compound" | "isolation"
  movementPattern?:  MovementPattern
  difficulty?:       "beginner" | "intermediate" | "advanced"
  instructions?:     string
  tips?:             string
  commonMistakes?:   string
  videoUrl?:         string
  imageUrl?:         string
  isCustom:          boolean         // User-created vs. global library
  userId?:           string          // Set if isCustom = true
  tags?:             string[]
  aliases?:          string[]        // Alternative names for search
}

export type MovementPattern =
  | "push"
  | "pull"
  | "squat"
  | "hinge"
  | "carry"
  | "lunge"
  | "rotation"
  | "isolation"
  | "cardio"

export type ExerciseCategory =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "resistance_band"
  | "cardio"
  | "plyometric"
  | "stretching"

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "kettlebell"
  | "resistance_band"
  | "pullup_bar"
  | "dip_bar"
  | "bench"
  | "box"
  | "foam_roller"
  | "none"

// ─── Set ──────────────────────────────────────────────────────────
export interface WorkoutSet {
  id:          string
  setNumber:   number
  type:        SetType
  reps?:       number
  weight?:     number           // Always stored in kg
  duration?:   number           // Seconds (for timed sets/cardio)
  distance?:   number           // Meters
  rpe?:        number           // Rate of Perceived Exertion (1-10)
  rir?:        number           // Reps in Reserve (0-5)
  notes?:      string
  isWarmup:    boolean
  isDropset:   boolean
  completed:   boolean
  completedAt?: Timestamp
}

export type SetType = "normal" | "warmup" | "dropset" | "failure" | "amrap" | "timed"

// ─── Exercise In Session ──────────────────────────────────────────
export interface SessionExercise {
  id:           string
  exerciseId:   string
  exercise?:    Exercise         // Populated on read
  orderIndex:   number
  sets:         WorkoutSet[]
  notes?:       string
  restSeconds?: number
  supersetGroupId?: string      // Groups exercises into supersets

  // Pain & Technique Tracking
  painScale?: number            // 0 - 10
  painNotes?: string
  techniqueScore?: number       // 1 - 5
  techniqueNotes?: string
}

// ─── Workout Session ──────────────────────────────────────────────
export interface WorkoutSession {
  id:          string
  userId:      string
  programId?:  string
  programDayId?: string
  name:        string
  notes?:      string
  exercises:   SessionExercise[]

  // Status
  status:      "active" | "completed" | "cancelled"
  startedAt:   Timestamp
  completedAt?: Timestamp
  durationSeconds?: number      // Total workout duration

  // Computed (denormalized for query performance)
  totalVolume:   number          // Total kg moved
  totalSets:     number
  totalReps:     number
  exerciseCount: number
  musclesWorked: MuscleGroup[]
  prsAchieved?:  PersonalRecord[]
  bodyWeight?:   number          // User's weight at time of session (kg)
  estimatedCalories?: number
  averageRpe?:   number

  createdAt:   Timestamp
  updatedAt:   Timestamp
}

// ─── Program ──────────────────────────────────────────────────────
export interface TrainingProgram {
  id:             string
  userId:         string
  name:           string
  description?:   string
  goal?:          string
  durationWeeks?: number
  daysPerWeek:    number
  difficulty:     "beginner" | "intermediate" | "advanced"
  focus:          ProgramFocus[]
  days:           ProgramDay[]
  color?:         string         // Tailwind color token e.g. "green", "blue"
  icon?:          string         // Lucide icon name
  notes?:         string
  isTemplate:     boolean        // Community template vs. personal
  isActive:       boolean
  isArchived?:    boolean
  startedAt?:     Timestamp
  archivedAt?:    Timestamp
  createdAt:      Timestamp
  updatedAt:      Timestamp
}

// ─── Template (saved workout blueprint) ──────────────────────────
export interface WorkoutTemplate {
  id:          string
  userId:      string
  name:        string
  description?: string
  exercises:   ProgramExercise[]
  estimatedDurationMinutes?: number
  tags?:       string[]
  isFavorite?: boolean
  createdAt:   Timestamp
  updatedAt:   Timestamp
}

export type ProgramFocus =
  | "strength"
  | "hypertrophy"
  | "power"
  | "endurance"
  | "weight_loss"
  | "general_fitness"

export interface ProgramDay {
  id:         string
  name:       string
  dayOfWeek?: number             // 0 = Sunday, null = flexible
  orderIndex: number
  exercises:  ProgramExercise[]
  isRestDay:  boolean
}

export interface ProgramExercise {
  id:           string
  exerciseId:   string
  exercise?:    Exercise
  orderIndex:   number
  targetSets:   number
  targetReps:   string           // "8-12", "5", "AMRAP"
  targetWeight?: number          // kg
  targetRPE?:   number
  restSeconds:  number
  notes?:       string
}

// ─── Personal Record ──────────────────────────────────────────────
export interface PersonalRecord {
  id:           string
  userId:       string
  exerciseId:   string
  exercise?:    Exercise
  type:         PRType
  value:        number           // Weight in kg, reps, time in seconds
  previousValue?: number
  sessionId?:   string
  achievedAt:   Timestamp
  createdAt:    Timestamp
}

export type PRType =
  | "1rm"         // One-rep max (kg)
  | "3rm"
  | "5rm"
  | "10rm"
  | "max_reps"    // Most reps at bodyweight
  | "max_weight"  // Heaviest weight lifted for any reps
  | "best_set"    // Total volume (weight × reps) in one set

// ─── Volume Metrics ───────────────────────────────────────────────
export interface VolumeMetrics {
  date:         string           // "YYYY-MM-DD"
  totalVolume:  number           // kg
  totalSets:    number
  totalReps:    number
  sessionCount: number
  byMuscleGroup: Record<MuscleGroup, number>
}
