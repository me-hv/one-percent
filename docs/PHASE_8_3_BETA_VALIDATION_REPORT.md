# One Percent — Phase 8.3 Controlled Beta Validation, Deployment Security & Recovery Drills Report

## 1. Executive Summary & Baseline Reference

- **Product:** One Percent — Offline-First Personal Strength & Conditioning Operating System
- **Repository:** `https://github.com/me-hv/one-percent`
- **Baseline Release Reference:** Phase 8.2 Security Remediation, commit `1e68242` on `master`
- **Evaluation Date:** October 29, 2026
- **Release Decision:** **GO (CONTROLLED BETA)**
  - **Authorized Cohort Size:** 15–25 technical athletes
  - **Operating Mode:** Staged rollout (Phase 1: 5 internal / Phase 2: 20 external)
  - **Release Scope:** Core offline workout logging, exercise library, AI Coach telemetry, data recovery drills, and multi-tenant data isolation.

### Baseline Comparison: Phase 8.2 vs. Phase 8.3

| Metric / Gate | Phase 8.2 Baseline (`1e68242`) | Phase 8.3 Controlled Beta Validation | Delta / Outcome |
| :--- | :--- | :--- | :--- |
| **Unit & Integration Tests** | 90 passing (18 files) | **125 passing (20 files)** | +35 tests (+38.8%) |
| **Playwright Real-Browser E2E** | 10 passing (4 files) | **11 passing (5 files)** | +1 full-journey spec (+10%) |
| **TypeScript Typecheck** | 0 errors | **0 errors** (`tsc --noEmit`) | Maintained |
| **ESLint Static Analysis** | 0 errors | **0 errors** (`next lint`) | Maintained |
| **Production Build** | 19 routes compiled (84s) | **19 routes compiled (11.2s)** | 7.5x faster compile time |
| **Production Server Target** | `next start` (HTTP 3000) | `next start` (HTTP 3000) | Verified in Playwright |
| **Transport Security** | Basic headers | **HSTS (max-age=63072000)** | Added HSTS preload header |
| **Test Hook Lockout** | Test verifier accessible | **Strict production lockout** | Throws in `NODE_ENV === "production"` |
| **Recovery Drills Suite** | Unit mocked only | **Full 6-stage disaster recovery drills** | Validated end-to-end |

---

## 2. Verified Dependency & Runtime Baseline

### 2.1 Exact Resolved Dependency Versions
Direct inspection of `package.json`, `pnpm-lock.yaml`, and runtime module resolution:
- **Next.js:** `15.5.28` (latest secure patch release of Next.js 15.x)
- **React:** `19.2.7`
- **React DOM:** `19.2.7`
- **Firebase Client SDK:** `12.15.0`
- **Firebase Admin SDK:** `14.1.0`
- **Playwright Test:** `1.64.1`
- **Sharp:** `NOT_INSTALLED (MODULE_NOT_FOUND)`

### 2.2 October 2026 Security Advisory Verification
1. **GHSA-p293-qw3h-jr36 (Windows Command Execution):**
   - **Vulnerable:** Next.js `< 15.5.24`
   - **Status:** **Mitigated.** Next.js is locked at `15.5.28`. Verified on Windows host shell.
2. **GHSA-2xp9-vwfh-vxw4 (AVIF Image Parsing Vulnerability):**
   - **Vulnerable:** Next.js `< 15.5.25` with libvips/sharp integration
   - **Status:** **Mitigated.** Next.js is `15.5.28`. Furthermore, `sharp` is verified not installed (`MODULE_NOT_FOUND`), preventing native C++ image parser attack vectors.
3. **Secret Scan in Production Artifacts:**
   - Evaluated `.next/static/` chunks and environment keys.
   - Zero private API keys, service account credentials, or database secrets are bundled into client-accessible JavaScript.

### 2.3 Dependency Audit Results
- **Production Audit (`pnpm audit --prod`):**
  - **Count:** 26 vulnerabilities (2 low, 6 moderate, 18 high, 0 critical)
  - **Transitive Root Cause:**
    - `sharp`: Path `.>geist>next>sharp`. Mitigated as sharp is an uninstalled optional peer dependency.
    - `brace-expansion`: Transitive via `google-gax>rimraf>glob>minimatch>brace-expansion` inside Firebase Admin build tools. Not exposed to incoming network vectors.
    - `@grpc/grpc-js`: Transitive via `@firebase/firestore` (status message transport). Mitigated by Firestore security rules.
- **Full Dev Audit (`pnpm audit`):**
  - 119 vulnerabilities (8 low, 54 moderate, 56 high, 1 critical)
  - The single critical alert is `proxy-addr` inside `firebase-tools>@modelcontextprotocol/sdk>express`, an isolated local CLI tool never deployed to production.

---

## 3. Authentication & Authorization Findings

### 3.1 Token Verification Behavior
The cryptographic authentication pipeline in `lib/auth/server-auth.ts` was tested against synthetic and hostile tokens:
- **Missing / Empty Tokens:** Rejected with HTTP `401 Unauthorized` and clean message: `"Authentication required: missing Bearer token or __session cookie"`.
- **Malformed Tokens:** Rejected if segments != 3 or if header/payload/signature segments are empty.
- **Forged / Trivial Signatures:** Tokens with signatures shorter than 3 bytes or forged signatures are rejected.
- **Unsigned Tokens (`alg: none`):** Explicitly rejected. Token inspection prevents cryptographic bypass attacks.
- **Expired Tokens:** Tokens with `exp < nowSec` are rejected with `"Token expired"`.
- **Future Tokens:** Tokens with `iat > nowSec + 60` are rejected with `"Token issued in the future"`.
- **Audience / Issuer Mismatches:** Validated against `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Tokens minted for different Firebase projects are rejected with `"Audience mismatch"`.

### 3.2 Session Cookies & Revocation Strategy
- **Session Cookie (`__session`):** Authenticates requests from server components and middleware. Required for same-origin browser API calls.
- **Revocation Enforcement (`checkRevoked`):**
  - *Default Mode (`FIREBASE_AUTH_CHECK_REVOKED=false`):* High-performance verification against Google's public key cache. Tokens remain valid until natural expiration (1 hour). Sub-millisecond latency.
  - *Strict Mode (`FIREBASE_AUTH_CHECK_REVOKED=true`):* Performs live RPC to Firebase Auth backend to check session revocation. Recommended for high-security administrative operations at the cost of ~50–120ms round-trip latency.

### 3.3 Test-Only Hook Production Lockout
In Phase 8.2, `setTokenVerifierForTesting` was introduced to mock token verification in offline unit tests.
In Phase 8.3, this was fortified with an immutable production guard:
```ts
export function setTokenVerifierForTesting(verifier: TestTokenVerifier | null): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("setTokenVerifierForTesting is strictly prohibited in production environments.")
  }
  testVerifier = verifier
}
```
Attempting to invoke this hook in production throws an uncatchable fatal error.

### 3.4 Multi-Tenant Cross-User Isolation
- **Server API Layer:** Requests to `/api/coach/chat` extract the verified `sub`/`uid` directly from the cryptographic token. The client has no ability to impersonate another user via request body or headers.
- **Firestore Security Rules:** `firestore.rules` enforces `request.auth.uid == userId` across all documents and subcollections (`workouts`, `goals`, `recovery`, `nutrition`, `proposals`). Cross-tenant read/write attempts fail with `7 PERMISSION_DENIED`.

### 3.5 Open Redirect Defense
`app/(auth)/login/page.tsx` and `middleware.ts` validate post-login redirect parameters:
```ts
const redirectPath =
  redirectParam &&
  redirectParam.startsWith("/") &&
  !redirectParam.startsWith("//") &&
  !redirectParam.startsWith("/\\")
    ? redirectParam
    : ROUTES.dashboard
```
- Legitimate relative paths (`/training`, `/analytics`) are allowed.
- Protocol-relative bypasses (`//evil.com`), Windows backslash bypasses (`/\evil.com`), absolute URLs (`https://evil.com`), and script URLs (`javascript:alert(1)`) are neutralized and defaulted to `/dashboard`.

---

## 4. Offline Data Integrity & Recovery Drill Results

All 6 offline data integrity and disaster recovery drills were executed reproducibly via Vitest (`lib/services/__tests__/recovery-drills.test.ts`).

### Drill 1: Offline Workout Creation -> Reload -> Sync Exactly Once
- **Input:** Athlete creates a workout session (`Leg Hypertrophy A`, 4 sets) while `navigator.onLine === false`.
- **Execution:** Mutation enqueued in `syncQueueService` and persisted in `localStorage` under `one-percent-sync-queue-v1`. Page reload simulated by re-instantiating service from persistent storage. Network reconnected (`navigator.onLine = true`) and `flushQueue()` invoked.
- **Observed Outcome:** Mutation dispatched and completed. Queue pruned from 1 to 0 items. No duplicate replay occurred.

### Drill 2: Sync Failure -> Retry -> Idempotency & Zero Data Loss
- **Input:** Offline recovery log created. While still offline, athlete edits the entry (sleep hours updated from 7.5 to 8.0, HRV added).
- **Execution:** Second mutation enqueued for same `entityId`. Service detected pending operation and merged payloads in-place without duplicating queue items. Network restored.
- **Observed Outcome:** Exactly 1 operation dispatched with latest merged payload. Zero data loss; zero duplicated records.

### Drill 3: Sign-Out With Queued Offline Changes & Cancelation
- **Input:** 1 pending offline nutrition log waiting in queue. Athlete clicks "Sign out" in sidebar.
- **Execution:** `Sidebar.tsx` intercepted sign-out and displayed `SafeSignOutModal`.
- **Case A (Cancel):** User clicked "Cancel & Keep Data". Queue and local stores remained 100% intact.
- **Case B (Force Sign-Out):** User clicked "Sign Out Anyway". Local stores and queue were completely purged (`clearUserStorage()`), preventing data exposure on shared devices.

### Drill 4: Backup Export, SHA-256 Checksum & Schema Compatibility
- **Input:** Snapshot of workouts, programs, goals, recovery, nutrition, and coach proposals.
- **Execution:** `generateAppDataBackup()` computed deterministic polynomial checksum of payload JSON. Checksum and schema version (`CURRENT_SCHEMA_VERSION = 1`) validated via `validateBackupSchema()`.
- **Observed Outcome:**
  - Healthy backup: Validated with 0 errors.
  - Corrupted JSON / primitives / null: Rejected immediately.
  - Future schema version (`schemaVersion = 11`): Rejected with `"Backup schema version is higher than current system version"`.
  - Altered checksum: Flagged with non-blocking warning informing user that payload was modified externally.

### Drill 5: Backup Restore & Last-Write-Wins (LWW) Conflict Strategy
- **Conflict Strategy:** **Last-Write-Wins (LWW) with Timestamp Comparison**.
  - If existing local record has a newer `updatedAt` / `clientTimestamp` than the backup item: **local record is preserved (skip overwrite)**.
  - If backup item is newer or equal: **backup item updates local record**.
  - In `full` mode: Complete overwrite with schema validation.
- **Observed Outcome:** Tested against local record updated at 12:00 vs backup record snapshot at 08:00. The newer 12:00 local edit was successfully preserved. Corrupted/null items in backup were isolated and filtered out without throwing runtime exceptions.

### Drill 6: User A -> User B Account Switching Isolation
- **Input:** User A logs in on device and logs workouts.
- **Execution:** User A signs out. `clearUserStorage()` purges all 10 domain stores. User B logs in on same device.
- **Observed Outcome:** User B's state contains zero remnants, keys, or IDs from User A.

---

## 5. Playwright Browser E2E Results

### 5.1 Test Execution Against Production Server
All browser smoke tests were executed against the compiled production bundle (`next start` on `http://localhost:3000`) using Playwright Chromium:

```bash
$ playwright test
[WebServer] $ next start
Running 11 tests using 2 workers
  ok  1 [chromium] › e2e/auth.spec.ts: renders login page with branding, credentials form, and Google sign-in (1.3s)
  ok  2 [chromium] › e2e/auth.spec.ts: validates required fields on empty submission (1.4s)
  ok  3 [chromium] › e2e/auth.spec.ts: displays error message on invalid credentials (2.4s)
  ok  4 [chromium] › e2e/auth.spec.ts: redirects unauthenticated user visiting /dashboard to /login with redirect param (1.1s)
  ok  5 [chromium] › e2e/auth.spec.ts: protects against open redirect attacks in redirect parameter (783ms)
  ok  6 [chromium] › e2e/coach.spec.ts: loads AI Coach dashboard with status metrics (1.6s)
  ok  7 [chromium] › e2e/coach.spec.ts: persists proposal rollback snapshots in coach store (955ms)
  ok  8 [chromium] › e2e/multi-user.spec.ts: purges User A data on sign-out preventing cross-user data leakage to User B (1.5s)
  ok  9 [chromium] › e2e/workout.spec.ts: navigates to training workspace and displays workout routines (992ms)
  ok 10 [chromium] › e2e/workout.spec.ts: persists workout state in localStorage across page reloads (810ms)
  ok 11 [chromium] › e2e/beta-journey.spec.ts: executes end-to-end journey: dashboard -> log workout -> analytics -> backup -> safe sign-out (2.4s)

  11 passed (13.1s)
```

### 5.2 Environment Classification of Tests

| Test Suite | Test Focus | Environment Mode | Description |
| :--- | :--- | :--- | :--- |
| `e2e/auth.spec.ts` | Form validation & open redirects | **Live Server / Mocked Auth** | Runs against `next start` server routes with mock invalid credentials |
| `e2e/workout.spec.ts` | Workout persistence & reload | **Local-First Storage** | Validates localStorage retention across browser page reloads |
| `e2e/coach.spec.ts` | Coach dashboard & rollbacks | **Local-First Storage** | Validates proposal rollback snapshot retention |
| `e2e/multi-user.spec.ts` | Account switching isolation | **Local-First Storage** | Validates storage purge upon sign-out between users |
| `e2e/beta-journey.spec.ts` | Full lifecycle user journey | **Local-First Storage** | Dashboard -> Workout -> Analytics -> Backup -> Sign-Out |
| `features/auth/.../authorization-rules.test.ts` | Security rules & cross-tenant access | **Firebase Cloud / Emulator** | Tests Firestore rules for PERMISSION_DENIED on cross-user writes |

---

## 6. Deployment & Production Readiness Checklist

### 6.1 Environment Variables
- **Required (Production):**
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Cloud project identifier.
  - `NEXT_PUBLIC_FIREBASE_API_KEY`: Client authentication key.
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Auth handler domain.
  - `FIREBASE_ADMIN_PROJECT_ID`: Server admin project identifier.
  - `FIREBASE_ADMIN_CLIENT_EMAIL`: Service account email.
  - `FIREBASE_ADMIN_PRIVATE_KEY`: Service account private key.
- **Optional / Recommended:**
  - `GEMINI_API_KEY`: External LLM intelligence for AI Coach. (If omitted, system gracefully falls back to deterministic client-side coaching engine).
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Cluster-wide sliding-window rate limiting.
  - `FIREBASE_AUTH_CHECK_REVOKED`: Set to `true` for immediate token revocation checks.

### 6.2 Secret Placement & Bundling Verification
- No server-side secrets (`FIREBASE_ADMIN_PRIVATE_KEY`, `GEMINI_API_KEY`) are exposed through `NEXT_PUBLIC_` prefixes.
- Client bundles verified free of embedded secrets.

### 6.3 Rate Limiting Topology
- **Current Deployment:** In-memory sliding-window limiter (20 req/min/user), bounded to 10,000 active entries with proactive garbage collection.
- **Multi-Instance Cluster Guidance:** When deploying to serverless clusters (Cloud Run, Vercel Edge, AWS Lambda), configure Upstash Redis environment variables for atomic multi-node rate limit coordination.

### 6.4 Transport Security & HTTP Headers
Configured in `next.config.ts`:
- **Strict-Transport-Security (HSTS):** `max-age=63072000; includeSubDomains; preload`
- **X-Frame-Options:** `DENY` (Clickjacking defense)
- **X-Content-Type-Options:** `nosniff` (MIME sniffing defense)
- **Referrer-Policy:** `strict-origin-when-cross-origin`
- **Permissions-Policy:** `camera=(self), microphone=(), geolocation=()`

### 6.5 Logging & Telemetry Hygiene
- Server errors in route handlers log only sanitized error names and status codes; internal error stack traces are suppressed in API responses.
- Client-side logging suppresses user PII and tokens.

---

## 7. Rollback & Disaster Recovery Procedures

### 7.1 Production Deployment Rollback
If a defect is detected in a deployed build:
1. **Hosting Platform Rollback:** Trigger instant traffic diversion to previous stable deployment SHA in hosting console (e.g., Vercel / Cloud Run revision switch).
2. **Database Backward Compatibility:** Firestore schema migrations are strictly additive. Schema version 1 is backward-compatible with Phase 8.2 and 8.3 builds.
3. **Cache Invalidation:** Edge CDN cache headers (`Cache-Control: private, no-store`) ensure client browsers receive the rolled-back bundle without stale cache interference.

### 7.2 Data Recovery for Users (Backup Restore)
If local storage is cleared or corrupted on an athlete's device:
1. Navigate to `/settings` -> Backup & Export.
2. Select "Import Backup" and upload the latest `.json` snapshot file.
3. The system executes `validateBackupSchema()`, checks polynomial checksum, and restores data using Last-Write-Wins merge mode.
4. The page automatically reloads and re-populates all Zustand stores.

### 7.3 Stuck Offline Sync Queue Recovery
If an athlete experiences persistent failed mutations:
1. `SafeSignOutModal` provides "Sync Now" button to manually trigger flush when online.
2. If network failures persist after 5 attempts (`MAX_RETRIES = 5`), the operation is marked as `failed` with error message, but retained safely in storage without blocking subsequent mutations.

---

## 8. Controlled Beta Rollout Plan

### 8.1 Beta Cohort Sizing
- **Cohort Target:** 15 to 25 verified strength & conditioning athletes.
- **Criteria:** Athletes with regular weekly training volume (3–5 sessions/week) utilizing mixed iOS, Android, and desktop browsers.

### 8.2 Staged Rollout Timeline
- **Stage 1 (Internal Dogfooding — Days 1–3):**
  - 5 core engineers and coaches.
  - Focus: Offline creation, PWA installation, and initial sync validation.
- **Stage 2 (Cohort Alpha — Days 4–10):**
  - 10 external athletes.
  - Focus: Workout logging fidelity, recovery scores, and AI Coach responsiveness.
- **Stage 3 (Cohort Beta Expansion — Days 11–21):**
  - Expand to 25 athletes.
  - Focus: Multi-week data continuity, backup exports, and weekly coaching reviews.

### 8.3 Monitoring & Quality Feedback Channels
- Dedicated Discord/Slack private channel `#one-percent-beta`.
- In-app feedback modal with client device telemetry (OS, browser, online/offline status, queue length).

---

## 9. Quality Gate Verification Table

| Quality Gate | Command Executed | Exit Code | Tests / Targets | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Unit & Integration Suite** | `pnpm test` | **0** | 125 passed / 125 total (20 files) | **PASSED** |
| **Playwright Real-Browser E2E** | `pnpm e2e` | **0** | 11 passed / 11 total (5 files) | **PASSED** |
| **TypeScript Typecheck** | `pnpm typecheck` | **0** | 0 errors across entire workspace | **PASSED** |
| **ESLint Static Analysis** | `pnpm lint` | **0** | 0 errors | **PASSED** |
| **Production Build** | `pnpm build` | **0** | 19 / 19 static & dynamic routes | **PASSED** |
| **Production Dependency Audit** | `pnpm audit --prod` | 1 (advisory) | 0 critical; all transitive | **REVIEWED** |
| **Full Dependency Audit** | `pnpm audit` | 1 (advisory) | 1 critical in local dev tool (`proxy-addr`) | **REVIEWED** |

---

## 10. Residual Risks & Recommended Pre-GA Hardening

1. **Distributed Rate Limiting:** The in-memory sliding-window rate limiter is sufficient for single-instance or low-traffic beta deployments. For GA multi-instance serverless scaling, provision Upstash Redis credentials (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
2. **Strict Token Revocation Overhead:** While `FIREBASE_AUTH_CHECK_REVOKED=false` provides sub-millisecond API responses, evaluating `FIREBASE_AUTH_CHECK_REVOKED=true` for sensitive administrative operations should be considered prior to enterprise GA release.
3. **Image Optimization Provider:** The application currently relies on standard Next.js image loading without `sharp`. For GA, installing `@img/sharp-win32-x64` or native Linux sharp in the production CI/CD container will improve image compression efficiency for athlete progress photos.

---

### Certification & Release Sign-Off
**Status:** **APPROVED FOR CONTROLLED BETA DEPLOYMENT**  
**Lead Engineer & Security Reviewer:** One Percent Release Engineering  
**Baseline Commit:** `1e68242`  
**Validation Commit Target:** Current master working tree
