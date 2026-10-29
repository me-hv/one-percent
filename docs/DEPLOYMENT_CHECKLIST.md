# One Percent — Production Deployment Checklist
**Release Version:** v8.0.0
**Target Environment:** Production (Vercel / Node.js Next.js standalone)
**Scope:** Phase 8.0 Production Readiness, Security & Release Hardening

---

## 1. Pre-Deployment Configuration & Environment Audit

- [ ] **Environment Variables Audit**
  - Verify all variables in `.env.example` are populated in the deployment provider (Vercel / Cloud Run).
  - Confirm `NEXT_PUBLIC_APP_ENV=production`.
  - Confirm `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false`.
  - Confirm `NEXT_PUBLIC_FIREBASE_*` match production Firebase project configuration.
  - Confirm `FIREBASE_ADMIN_*` service account private keys and client emails are securely set in server environment secrets (never exposed to client).
  - Verify `GEMINI_API_KEY` is set in production environment secrets for AI Coach inference.

- [ ] **Firebase & Cloud Firestore Configuration**
  - Verify Firestore Security Rules (`firestore.rules`) are deployed:
    - User isolation: All `/users/{userId}` documents and subcollections strictly enforce `request.auth.uid == userId`.
    - Cross-user reads/writes denied (`PERMISSION_DENIED`).
  - Verify Cloud Storage Security Rules (`storage.rules`) are deployed:
    - User avatar and export directories strictly restricted to `request.auth.uid == userId`.
  - Verify Google Sign-In and Email/Password auth providers are enabled in Firebase Console.
  - Authorized Domains: Add custom production domain(s) and Vercel production deployment URLs to Firebase Authorized Domains.

- [ ] **Security & Network Configuration**
  - Verify `/api/coach/chat` route requires `Authorization: Bearer <idToken>` or authenticated `__session` cookie.
  - Verify rate limiter is configured (20 requests/minute per authenticated user).
  - Verify payload body limits (32 KB max request size, 1,000 char max message length).
  - Verify Content Security Policy (CSP) and HTTP security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`).

---

## 2. Automated Quality Gates

Prior to promoting any build artifact to production, the continuous integration pipeline must pass:

- [ ] **Unit & Integration Tests**: `pnpm test` (100% pass across all 17 test suites, 79+ tests).
- [ ] **TypeScript Typecheck**: `pnpm typecheck` (`tsc --noEmit` exits with code 0).
- [ ] **Linting**: `pnpm lint` (`next lint` exits with code 0).
- [ ] **Production Compilation**: `pnpm build` (`next build` succeeds with 19 static/dynamic routes prerendered).
- [ ] **End-to-End User Journey Regression**: `pnpm test tests/e2e/user-journey.test.ts` (13 milestones verified).

---

## 3. Post-Deployment Smoke Verification

Immediately following deployment, run through smoke verification in a clean browser profile:

- [ ] **Authentication Flow**
  - Register a new test account / log in with Google.
  - Verify `__session` cookie is established with `Secure`, `SameSite=Lax`.
  - Verify profile initialization in Firestore under `/users/{uid}`.
- [ ] **Offline & Storage Persistence**
  - Log a workout set, nutrition item, and recovery entry.
  - Verify local Zustand stores persist state across page reloads.
  - Verify offline sync queue flushes once online connection is stable.
- [ ] **AI Coach Safety**
  - Open `/coach`, send query. Verify responses adhere to training domain knowledge.
  - Request adaptive proposal. Verify proposal requires explicit user "Accept" or "Decline".
  - Accept proposal and verify changes applied to current program.
  - Click "Revert Proposal" and verify program returns to exact pre-proposal state.
- [ ] **Data Export & Backup Verification**
  - Navigate to Settings -> Backup & Export.
  - Download full JSON backup (`one-percent-backup-{date}.json`).
  - Verify checksum and schema structure across all 8 data domains.
  - Test restoring into clean state.
- [ ] **Session Termination & Local Cache Clearance**
  - Sign out via sidebar.
  - Verify redirection to `/login`.
  - Verify `__session` cookie is expired and deleted.
  - Inspect `localStorage` to ensure all `one-percent-*` user keys are wiped.
  - Log in with secondary account and confirm zero data leakage from previous account.

---

## 4. Rollback & Emergency Runbook

- **Instant Rollback**: If critical regression occurs, rollback deployment in Vercel to previous deployment hash in `< 30 seconds`.
- **Database Rollback**: Firestore document updates are idempotent; user local data is master and re-syncs through sync queue.
- **Support Contact / On-Call**: Lead engineer on-call notified via Sentry alert stream.
