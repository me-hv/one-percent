# Changelog

All notable changes to the One Percent Fitness Operating System are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
