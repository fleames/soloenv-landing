/**
 * Waitlist capture endpoint (recommended).
 *
 * The hero and final CTA forms POST { email, source } as JSON to this URL and
 * show an inline success message — no redirect, much higher conversion than a
 * Google Form bounce.
 *
 * Works out of the box with form back-ends that accept a JSON POST and return
 * 2xx, e.g.:
 *   - Formspree:  https://formspree.io/f/XXXXXXXX
 *   - Buttondown: https://api.buttondown.email/v1/subscribers (with proxy/key)
 *   - Your own /api/waitlist serverless function
 *
 * Leave the placeholder to fall back to the Google Form redirect (FORM_URL).
 */
export const WAITLIST_ENDPOINT = "https://formspree.io/f/YOUR_FORM_CODE";

/**
 * Optional fallback: published Google Form "view" URL.
 * Used only if WAITLIST_ENDPOINT is left as the placeholder above.
 */
export const FORM_URL =
  "https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform";

/**
 * Optional GA4 measurement ID (e.g. "G-XXXXXXXXXX").
 * Leave null to disable analytics until you are ready.
 * Fires a `waitlist_signup` event on successful submit.
 */
export const GA_MEASUREMENT_ID = null;

/**
 * When this SoloEnv environment was started (ISO 8601, UTC recommended).
 * Powers the live "uptime" counter in the hero — set it to the moment you ran
 * `soloenv up` on the VPS that serves this page.
 *
 * Tip: keep it accurate automatically by injecting the timestamp at deploy time,
 * e.g. before `soloenv up`:
 *   sed -i "s/__DEPLOYED_AT__/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" config.js
 *
 * Set to null to hide the counter entirely.
 */
export const DEPLOYED_AT = "2026-06-01T18:00:00Z";
