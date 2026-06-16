/**
 * LINE LIFF (LINE Front-end Framework) helper
 *
 * Exports:
 *   initLiff()         – initialise LIFF, returns true on success
 *   isLiffLoggedIn()   – whether the user is authenticated
 *   liffLogin()        – redirect to LINE login
 *   liffLogout()       – log out of LIFF
 *   getLiffProfile()   – fetch LINE profile (displayName, pictureUrl, userId)
 */

import type Liff from "@line/liff";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

let liffInstance: typeof Liff | null = null;
let initialized = false;

export async function initLiff(): Promise<boolean> {
  if (initialized) return true;
  if (typeof window === "undefined") return false;

  try {
    const liff = (await import("@line/liff")).default;
    await liff.init({ liffId: LIFF_ID });
    liffInstance = liff;
    initialized = true;
    return true;
  } catch (err) {
    console.error("[LIFF] init error:", err);
    return false;
  }
}

export function isLiffLoggedIn(): boolean {
  if (!liffInstance) return false;
  try {
    return liffInstance.isLoggedIn();
  } catch {
    return false;
  }
}

export function liffLogin(): void {
  if (!liffInstance) return;
  liffInstance.login();
}

export function liffLogout(): void {
  if (!liffInstance) return;
  liffInstance.logout();
  initialized = false;
  liffInstance = null;
}

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function getLiffProfile(): Promise<LiffProfile | null> {
  if (!liffInstance) return null;
  try {
    const profile = await liffInstance.getProfile();
    return profile;
  } catch (err) {
    console.error("[LIFF] getProfile error:", err);
    return null;
  }
}

/** True when running inside the LINE in-app browser */
export function isInLineApp(): boolean {
  if (typeof window === "undefined") return false;
  return /Line/i.test(navigator.userAgent);
}
