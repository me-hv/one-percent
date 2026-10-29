# One Percent — Data Backup, Restore & Disaster Recovery Runbook
**Version:** 8.0.0
**Target Role:** Site Reliability Engineers, Support Engineers, End Users

---

## 1. Overview & Architecture

One Percent employs a high-reliability, offline-first architecture with dual persistence layers:
1. **Local Persistent Storage**: IndexedDB and encrypted/namespaced `localStorage` keys partitioned by version (`v1`):
   - `one-percent-workout-store`
   - `one-percent-program-store`
   - `one-percent-exercise-library-store`
   - `one-percent-goal-store`
   - `one-percent-body-store`
   - `one-percent-recovery-store`
   - `one-percent-nutrition-store`
   - `one-percent-coach-store`
2. **Cloud Remote Storage**: Google Cloud Firestore partitioned strictly by user ID (`/users/{userId}/*`).

---

## 2. Backup File Format & Schema Specification

Backups exported from One Percent are validated JSON files formatted under the schema:

```typescript
interface BackupData {
  version: "1.0";
  exportedAt: string; // ISO 8601 string
  checksum: string;   // SHA-256 hex digest of serialized stores
  data: {
    workouts?: WorkoutState;
    programs?: ProgramState;
    exerciseLibrary?: ExerciseLibraryState;
    goals?: GoalState;
    body?: BodyState;
    recovery?: RecoveryState;
    nutrition?: NutritionState;
    coach?: CoachState;
  };
}
```

### Safety Controls
- **Max File Size**: 15 MB hard limit on import to prevent browser denial-of-service or memory exhaustion.
- **Checksum Integrity**: Imported files are verified against SHA-256 checksums to detect truncation or data corruption.
- **Strict Version Compatibility**: Mismatched major backup versions are safely rejected with actionable remediation instructions.

---

## 3. Export Procedure (User-Initiated)

1. Open One Percent and navigate to **Settings** -> **Data & Privacy**.
2. Click **Download Full Backup**.
3. The application consolidates all 8 local stores, serializes the payload, calculates the SHA-256 integrity hash, and triggers an automatic download of `one-percent-backup-{YYYY-MM-DD}.json`.
4. Store the file in cold storage or a secure personal directory.

---

## 4. Restore & Recovery Procedure

### Scenario A: Local Browser Corruption / New Device Setup
1. Log in to One Percent.
2. Navigate to **Settings** -> **Data & Privacy**.
3. Under **Import Backup**, select or drag-and-drop the backup JSON file.
4. Select restore strategy:
   - **Merge & Deduplicate (Recommended)**: Preserves existing local data while non-destructively inserting missing workout logs, nutrition records, recovery check-ins, and active programs.
   - **Replace / Overwrite**: Resets local stores to match the exact backup snapshot.
5. The system performs checksum validation, verifies the 15 MB limit, and rehydrates stores.
6. The sync queue is automatically signaled to synchronize the newly imported data to Firestore.

### Scenario B: Cloud Firestore Outage / Disaster Recovery
1. Because One Percent is offline-first, client devices continue reading and writing to local persistence without downtime.
2. All mutations are queued in the durable `SyncQueue`.
3. When Firestore connectivity is restored, the `syncQueueService` detects network availability and drains pending writes with exponential backoff and conflict resolution.

---

## 5. Security & Isolation Invariants

- **Multi-Tenant Quarantine**: Backup files only contain the authenticated user's records.
- **Local Cleanup on Signout**: When `authService.signOut()` is executed, all `one-percent-*` keys in `localStorage` are obliterated, preventing session leakage between users sharing a device.
- **Server Rule Enforcement**: Firestore security rules reject any backup restore attempt that tries to write records to another user's UID path.
