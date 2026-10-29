/**
 * Maps Firebase Authentication error codes to user-friendly, actionable error messages.
 * Never exposes sensitive tokens, passwords, or technical stack traces to end users.
 */
export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "An unexpected error occurred. Please try again."
  }

  const err = error as { code?: string; message?: string }
  const code = err.code || ""
  const isEmulatorEnabled =
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"

  switch (code) {
    case "auth/network-request-failed":
      if (isEmulatorEnabled) {
        return "Unable to reach the local Firebase Authentication Emulator. Please ensure the emulator is running on port 9099 ('pnpm emulator'), or set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false in .env.local to use the cloud backend."
      }
      return "Unable to connect to the authentication server. Please check your internet connection and ensure network requests are not blocked by a firewall, VPN, proxy, or browser extension."

    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email address or password. Please verify your credentials and try again."

    case "auth/invalid-email":
      return "The email address is improperly formatted. Please enter a valid email address."

    case "auth/user-disabled":
      return "This account has been disabled. Please contact support for assistance."

    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in instead."

    case "auth/weak-password":
      return "Password is too weak. Please choose a password with at least 6 characters, combining letters and numbers."

    case "auth/operation-not-allowed":
      return "This sign-in provider is not enabled for this project. Please enable Google or Email sign-in in the Firebase Console under Authentication > Sign-in method."

    case "auth/unauthorized-domain":
      return "This domain is not authorized for Firebase Authentication. Please add this domain to Authorized Domains in the Firebase Console under Authentication > Settings."

    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method. Please sign in using your original method."

    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups for this site and try again."

    case "auth/popup-closed-by-user":
      return "Authentication window was closed before completing sign-in."

    case "auth/cancelled-popup-request":
      return "Only one sign-in window can be open at a time. Please complete or close the existing window."

    case "auth/requires-recent-login":
      return "This sensitive action requires you to re-authenticate. Please log out and sign in again."

    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password."

    default:
      // Strip "Firebase: " prefix if present in the raw error message
      if (err.message && typeof err.message === "string") {
        const cleaned = err.message.replace(/^Firebase:\s*(Error\s*)?(\([^)]*\))?\s*/i, "").trim()
        if (cleaned && cleaned.length > 0 && !cleaned.startsWith("(") && !cleaned.includes("http")) {
          return cleaned
        }
      }
      return "Authentication failed. Please check your credentials and try again."
  }
}
