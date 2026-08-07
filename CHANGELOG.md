# Changelog

All notable changes to the One Percent Fitness Operating System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-08-07 — Phase 7.3 Progress Intelligence Release

### Added
- **Analytics Calculations Foundation**:
  - `analytics.utils.ts` with 1RM estimations (Epley & Brzycki formulas), moving averages, linear regression trendlines, consistency scores, and percentage change.
  - `pr.service.ts` for tracking Weight PRs, Rep PRs, Set Volume PRs, E1RM PRs, and PR Leaderboard.
  - `insights.service.ts` deterministic smart insight rule engine for volume progression, muscle focus/neglect alerts, PR notifications, and consistency streaks.
- **Dashboard Intelligence Widgets**:
  - Live `InsightsWidget` rendering real-time deterministic insights and recently broken milestones ticker.
  - Wired live data connections into `CoachBriefing`, `TrainingWidget`, `StreakWidget`, `GoalsWidget`, `NutritionWidget`, `RecoveryWidget`, and `HabitsWidget`.
- **Progress Center & HTML5 Canvas Photo Compression**:
  - Client-side canvas image compression utility (`compressImage`) scaling uploads down to optimized JPEGs (<500KB Data URLs).
  - Side-by-side comparative photo visual slider, historical entries editor, and trend calculations against all-time baselines.
- **Analytics Experience Hub**:
  - Interactive timeframe filters (`7d`, `30d`, `90d`, `1y`, `all`).
  - Interactive Recharts visualization suites for Volume Progression, Target Muscle Focus Radar, Weekly Workout Frequency, and RPE Session Intensity.
  - `TrainingCalendar` component with interactive heatmaps, workout session drawers, and volume metrics.
  - `PRLeaderboard` component with search filtering, muscle breakdown, and milestone history.
  - Upgraded Exercise Inspector (`/training/exercises/[id]`) with estimated 1RM progression charts and all-time personal best records.

## [0.8.0] - 2026-08-07 — Phase 7.2 Release

### Added
- **Complete Program Management System**:
  - Full CRUD operations for training programs (Create, Edit, Duplicate, Archive, Restore, Delete, Favorite, Set Active).
  - Program metadata support: goals, difficulty levels, duration in weeks, days per week, color themes, and custom notes.
- **Weekly Schedule Planner**:
  - Interactive Mon-Sun weekly calendar grid with drag-and-drop workout day scheduling.
  - Controls to duplicate days, copy full weekly schedules, clear weeks, and assign unscheduled days.
- **Workout & Exercise Builder**:
  - Configurable workout days with warm-up/cool-down notes, target volume, target RPE, estimated calories, and duration.
  - Exercise configuration supporting set types (`working`, `warmup`, `drop`, `failure`), target reps, target weight, rest times, and superset groupings.
- **Workout Template Manager**:
  - System to create, duplicate, favorite, export to `.json`, and import workout templates across categories (`Powerlifting`, `Bodybuilding`, `Push Pull Legs`, `Upper Lower`, `Full Body`, `Custom`).
- **Exercise Library & Custom Exercises**:
  - Searchable global exercise library with muscle group, movement pattern, equipment, and difficulty filters.
  - Custom Exercise Creation modal to create and save personal movements with muscle maps and execution tips.
  - Exercise Detail Modal with execution instructions, pro form tips, common mistakes, and personal record references.
- **Workout Engine Integration**:
  - Direct "Launch Workout" action from program days that pre-populates target sets, weights, reps, rest timers, and notes into the live Workout Engine (`/training/log`).
