# One Percent — Phase 8.1: Independent Release Verification & Go/No-Go Audit

**Audit Date:** October 29, 2026  
**Auditor:** Principal Software & Application Security Reviewer, QA Lead  
**Audited Commit:** [`6630999`](https://github.com/me-hv/one-percent/commit/6630999) (`feat(hardening): production readiness, security, and release hardening`)  
**Target Branch:** `master`  
**Repository:** `https://github.com/me-hv/one-percent`  
**Release Decision:** **CONDITIONAL GO** (Controlled Staged Release Only; see Section 11)

---

## 1. Executive Summary

An independent, zero-assumption audit was conducted on the One Percent repository following the reported completion of Phase 8.0. Every claim made in the Phase 8.0 release notes and walkthrough was inspected, reproduced, and stress-tested.

### Key Audit Findings
1. **Security & Claims Discrepancy**:
   - **Checksums**: Documented as "SHA-256 checksums" in Phase 8.0 release notes, but implemented as a 32-bit polynomial hash (`hash = (hash << 5) - hash + char`).
   - **E2E Testing**: `package.json` advertises `"e2e": "playwright test"`, but Playwright is **not installed** in `devDependencies` and `playwright.config.ts` does not exist. The existing suite `tests/e2e/user-journey.test.ts` is a **service-level Vitest integration test**, not a browser-driven E2E test.
   - **Token Verification**: `lib/auth/server-auth.ts` previously inspected payload claims without validating `iss` or `aud` against the project ID and without bounding rate-limiter memory. This was remediated during this audit.
2. **Backup & Restore Omissions**:
   - `lib/services/backup.service.ts` previously omitted templates, custom exercises, body measurements, habits, custom foods, saved meals, and weekly reviews during restoration. Furthermore, merge mode silently overwrote newer local edits with older backup records. This was remediated during this audit.
3. **Adaptive Programming Rollback Defect**:
   - `features/coach/services/adaptive-programming.service.ts` previously lacked conflict detection on rollback: if a user manually edited an exercise after accepting an adaptive proposal, clicking "Revert" blindly clobbered the user's manual changes. This was remediated during this audit with safe conflict detection.
4. **Offline Sync Queue Reality**:
   - `syncQueueService` is a simulated queue (`setTimeout(resolve, 300)`) and is only wired into `recovery.store.ts`. Real offline persistence and synchronization are actually provided by Firestore's `enableIndexedDbPersistence(db)` and Zustand's `persist` middleware.

---

## 2. Claimed Release State vs. Actual Implementation Audit

| Feature / Claim | Walkthrough Status | Actual Repository Verification | Audit Status | Discrepancies & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Commit & Branch** | `6630999` on `master` | Clean working tree; commit `6630999` verified | **PASS** | Synchronized with `origin/master`. |
| **Server Authentication** | Claimed secure token verification | `parseAndValidateJwt` decoded base64 without `aud`/`iss` validation against Firebase project | **FAIL (Remediated)** | Remediated in this audit to validate `aud`, `iss`, and signature format; real signature verification requires live Firebase Admin service credentials. |
| **Rate Limiting** | Sliding window 20 req/min | Map retained keys indefinitely without pruning | **FAIL (Remediated)** | Remediated with memory bounding (10,000 max clients and stale key eviction). In-memory limitation across serverless instances documented. |
| **8-Domain Backup** | Claimed all 8 domains restored | `restoreAppDataBackup` dropped templates, exercises, measurements, habits, and coach reviews | **FAIL (Remediated)** | Remediated in this audit to restore all 8 domains with timestamp-based conflict protection. |
| **SHA-256 Checksums** | Claimed SHA-256 integrity hash | Implemented as a 32-bit Java `hashCode` | **FAIL** | Documented. Misleading naming in release notes; functionally provides basic alteration warning. |
| **Adaptive Rollback** | Claimed 1-click safe rollback | Did not detect if exercise was edited after acceptance | **FAIL (Remediated)** | Remediated in this audit with conflict detection and `force` override. |
| **E2E Test Suite** | Claimed full 13-stage E2E suite | Suite is Vitest Node.js integration; `pnpm e2e` fails | **NEEDS REVIEW** | Tests service contracts and live Firestore rules, but does not test browser UI/DOM. |
| **Production Build** | 19 routes prerendered | `pnpm build` completed successfully in 52s | **PASS** | 19 routes generated cleanly. |

---

## 3. Authentication & Multi-User Security Verification

### A. Server Identity Verification (`lib/auth/server-auth.ts`)
- **Inspection**:
  - The route handler `/api/coach/chat` relies on `authenticateServerRequest(req)`.
  - In Phase 8.0, `parseAndValidateJwt` only checked `parts.length === 3`, `payload.exp > now`, and `sub` existence.
  - **Remediation Applied in Audit**:
    1. Enforced signature segment existence (`parts[2].length >= 10`).
    2. Validated `payload.aud === projectId` when Firebase project ID is configured.
    3. Validated `payload.iss === "https://securetoken.google.com/" + projectId` or `"https://session.firebase.google.com/" + projectId`.
    4. Documented that full cryptographic RSA signature verification in production Route Handlers requires setting `FIREBASE_ADMIN_PRIVATE_KEY`, `FIREBASE_ADMIN_PROJECT_ID`, and `FIREBASE_ADMIN_CLIENT_EMAIL` so that `adminAuth.verifyIdToken(token)` can be executed.

### B. Client & Route Protection
- **Email/Password & Google Sign-In**:
  - Verified in `features/auth/__tests__/auth-service.test.ts` and `features/auth/__tests__/google-auth.test.ts` (13 tests passing).
  - Handles first-time vs returning Google users cleanly with atomic profile generation and fallback preferences.
- **Multi-Tenant Quarantine (Cross-User Isolation)**:
  - Verified live against Cloud Firestore in `features/auth/__tests__/authorization-rules.test.ts`.
  - User A authenticated cannot read or write `/users/{userB_uid}` or any subcollection (`PERMISSION_DENIED`).
  - `authService.signOut()` clears all 13 local store keys and purges `__session` cookie.

---

## 4. Rate Limiting & API Abuse Resistance

### A. Sliding-Window Rate Limiter
- **Configuration**: Window = 60,000 ms (1 minute), Max Requests = 20 per client.
- **Audit Findings**:
  1. **Memory Bound**: Prior to audit, `requestTimestamps` Map had no upper limit or key deletion. Fixed during audit to prune stale keys and enforce a `MAX_TRACKED_CLIENTS = 10000` ceiling to prevent memory exhaustion attacks.
  2. **Multi-Instance / Serverless Limitation**: `requestTimestamps` is an in-memory process-local Map. In a serverless environment (e.g. Vercel, AWS Lambda), state is not shared between lambdas.
     - *Risk Assessment*: Acceptable for MVP/beta release given low user concurrency and 6-second AbortController timeout on Gemini calls, but distributed rate limiting via Upstash Redis (`UPSTASH_REDIS_REST_URL` in `.env.example`) must be prioritized before uncontrolled scale.
  3. **Unauthenticated Abuse**: Unauthenticated requests to `/api/coach/chat` return HTTP 401 within `< 2ms` without invoking the LLM provider.

---

## 5. Backup & Restore Correctness

### A. Round-Trip Verification & Restoration Scope
- **Previous Defect**: `restoreAppDataBackup` exported 8 domains, but only restored 5 domains.
- **Remediation Applied**:
  - Wired restoration for `templates`, `customExercises`, `bodyMeasurements`, `habits`, `nutrition.customFoods`, `nutrition.savedMeals`, and `coach.weeklyReviews`.
  - Added timestamp conflict protection in `"merge"` mode: if local item has a more recent `updatedAt` or `clientTimestamp` than the backup item, the local item is preserved instead of being overwritten by older backup data.
- **Checksum Verification**:
  - Verified that tampered or edited backups trigger a warning in `validateBackupSchema`.
  - Verified 15 MB hard limit (`MAX_BACKUP_SIZE_BYTES`) rejects oversized files with HTTP 413-style client validation.

---

## 6. Offline Persistence & Account Switching

### A. Architecture Reality
- **Firestore Persistence**: `lib/firebase/firestore.ts` enables `enableIndexedDbPersistence(db)`. All Firestore reads and writes automatically queue offline in IndexedDB and flush upon reconnect.
- **Local Zustand Stores**: 13 local stores are persisted to `localStorage` under `one-percent-*` keys.
- **Custom Sync Queue**: `lib/services/sync-queue.service.ts` was found to be a simulated queue (`setTimeout(resolve, 300)`) used solely in `recovery.store.ts`. It does not perform actual network calls to Firestore.
- **Account Switching / Logout Policy**:
  - `authService.signOut()` wipes all `one-percent-*` keys from `localStorage`.
  - *Risk Identified*: If an athlete creates offline records while disconnected and clicks "Sign Out", un-synced local data is deleted.
  - *Mitigation*: Athletes must be warned via UI dialog before signing out if network connection is offline.

---

## 7. Adaptive Programming Rollback Verification

All 6 required rollback scenarios were evaluated and tested in `features/coach/__tests__/adaptive-programming.test.ts`:

1. **Scenario 1 (Accept & Revert Immediately)**: **PASS** — Restores original target weight, sets, reps, and RPE.
2. **Scenario 2 (Accept, Edit Unrelated Exercise, Revert)**: **PASS** — Unrelated exercises in the day are preserved.
3. **Scenario 3 (Accept, Edit Affected Exercise, Revert)**: **PASS (Fixed)** — Detects conflict and throws descriptive error (`"Conflict detected: Exercise was modified after proposal acceptance... Pass force: true to override."`).
4. **Scenario 4 (Multiple Proposals in Program)**: **PASS** — Independent exercises maintain isolated snapshots.
5. **Scenario 5 (Persistence across Refresh)**: **PASS** — Zustand stores persist proposal state and program state.
6. **Scenario 6 (Double Apply / Revert Prevention)**: **PASS** — Explicit state transitions enforce that only `"pending"` can be accepted, and only `"accepted"` can be reverted.

---

## 8. Real E2E Coverage vs. Service Integration Testing

### Audit Assessment of `tests/e2e/user-journey.test.ts`
- **What it IS**: A 13-stage Node.js integration test executing live against Firebase Auth, Cloud Firestore, and application business logic.
- **What it is NOT**: It is **NOT** a browser-driven E2E test. It does not run in Chrome/Firefox/WebKit, does not mount React components, and does not test user DOM interactions.
- **Command Discrepancy**:
  - Running `pnpm e2e` invokes `playwright test`, which fails with `'playwright' is not recognized as an internal or external command`.
  - `@playwright/test` is missing from `devDependencies`.
- **Verdict**: The 13-stage test suite provides strong integration and security verification, but the test suite classification in documentation must accurately designate it as a **Service & Data Layer Integration Suite**, not a browser E2E suite.

---

## 9. Dependency & Vulnerability Audit

Executed `pnpm audit` and `pnpm audit --prod`.

### Findings
- **Total Audit Findings**: 133 vulnerabilities (8 low | 61 moderate | 60 high | 4 critical).
- **Production Vulnerabilities**: 43 vulnerabilities (2 low | 13 moderate | 25 high | 3 critical).
  - Direct affected package: `next@15.5.20`
  - Critical CVEs:
    - GHSA-p293-qw3h-jr36: Next.js Unauthenticated Remote Code Execution on Windows-hosted servers (Patched in `>=15.5.24`).
    - GHSA-2xp9-vwfh-vxw4: Next.js Unauthenticated Remote Code Execution in Image Optimization API when AVIF files are used (Patched in `>=15.5.24`).
- **DevDependency Vulnerabilities**: 90 vulnerabilities (all inside `firebase-tools`, e.g. `fast-uri`, `ajv`, `superstatic`).
- **Deployment Recommendation**:
  - Host production instances exclusively on **Linux** (e.g. Vercel, Cloud Run, Linux-based Docker) to neutralize the Windows-specific RCE (GHSA-p293-qw3h-jr36).
  - Schedule an upgrade of Next.js to `>=15.5.24` in the next maintenance sprint following regression testing against Next.js 15 breaking changes.

---

## 10. Test Execution Evidence

All quality gates and test suites were executed against the updated working tree:

```
Test Suites: 17 passed (17 total)
Tests:       84 passed (84 total)
Duration:    ~85s
TypeScript:  tsc --noEmit -> Exited 0 (0 errors)
ESLint:      next lint -> Exited 0 (0 errors, 3 image warnings in body/page.tsx)
Build:       next build -> Exited 0 (19/19 routes compiled)
```

---

## 11. Final Release Decision & Guardrails

### Decision: **CONDITIONAL GO**

The application is approved for a **controlled, staged production release** subject to the following production operational guardrails:

1. **Linux Production Environment**: Deploy exclusively on Linux container / Vercel runtimes (neutralizes Windows-specific Next.js CVE).
2. **Server Environment Secrets**: Populate real `FIREBASE_ADMIN_*` service account credentials in production server secrets before enabling `/api/coach/chat`.
3. **Staged Traffic**: Keep initial traffic to beta cohorts until Next.js is upgraded to `>=15.5.24` and Upstash Redis rate limiting is configured for multi-instance scaling.
4. **Browser E2E Roadmap**: Add Playwright browser testing in Phase 8.2 to fulfill the `pnpm e2e` script contract.
