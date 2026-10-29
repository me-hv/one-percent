import { describe, it, expect } from "vitest"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from "firebase/auth"
import fs from "fs"

describe("Firebase Auth Diagnostics", () => {
  const envContent = fs.readFileSync(".env.local", "utf-8")
  const getEnv = (key: string) => {
    const m = envContent.match(new RegExp(`${key}=(.*)`))
    return m && m[1] ? m[1].trim().replace(/^["']|["']$/g, "") : ""
  }

  const config = {
    apiKey: getEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  }

  it("reproduces auth/network-request-failed when emulator is configured but not running", async () => {
    const app = initializeApp(config, "test-emulator-app")
    const testAuth = getAuth(app)
    connectAuthEmulator(testAuth, "http://localhost:9099", { disableWarnings: true })

    let errorCode = ""
    try {
      await signInWithEmailAndPassword(testAuth, "test@onepercent.app", "wrongpassword123")
    } catch (err: any) {
      errorCode = err.code
      console.log("With emulator configured: code =", err.code, "message =", err.message)
    }

    expect(errorCode).toBe("auth/network-request-failed")
  })

  it("successfully reaches Firebase live cloud when emulator is NOT configured", async () => {
    const app = initializeApp(config, "test-live-app")
    const testAuth = getAuth(app)

    let errorCode = ""
    try {
      await signInWithEmailAndPassword(testAuth, "test@onepercent.app", "wrongpassword123")
    } catch (err: any) {
      errorCode = err.code
      console.log("Without emulator (live cloud): code =", err.code, "message =", err.message)
    }

    // In live Firebase, this should return auth/invalid-credential or auth/user-not-found, NOT auth/network-request-failed!
    expect(errorCode).not.toBe("auth/network-request-failed")
    expect(["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"]).toContain(errorCode)
  })
})
