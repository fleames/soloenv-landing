# SoloEnv landing page

Static pre-launch waitlist page for **Experiment 1** of the SoloEnv validation playbook: gauge interest in one-command ephemeral staging before building the CLI.

## Quick start

1. Create a [Google Form](https://forms.google.com) (see fields below).
2. Publish the form and copy the **view** link.
3. Paste the link into [`config.js`](config.js) as `FORM_URL`.
4. Preview locally:

   ```powershell
   cd soloenv-landing
   npx --yes serve .
   ```

   Open the URL shown (usually http://localhost:3000). ES modules require a local server — opening `index.html` directly in the browser will not load `main.js`.

5. Deploy to Netlify, Vercel, or GitHub Pages (see [Deploy](#deploy)).

## Google Form fields

Create a form that matches validation goals:

| Field | Type | Required |
|-------|------|----------|
| Email | Short answer or Email | Yes |
| Role | Dropdown (optional) | No — e.g. Solo founder, Indie hacker, Freelancer, Other |
| Stage | Dropdown (optional) | No — e.g. Side project, Full-time product, Agency client work |
| I build web apps with Docker | Multiple choice (optional) | No — Yes / No / Not sure |

Link the primary CTA to this form via `FORM_URL` in `config.js`.

**Sign-up count** = number of Form responses (view in Google Sheets linked to the form).

### Optional: embed on page

Default is a new-tab redirect (best UX). To embed instead, use Google’s embed URL in an `<iframe>` in `index.html` and remove the redirect CTA — slower and harder to style.

## Configuration

[`config.js`](config.js):

- `FORM_URL` — published Google Form view URL (required before launch).
- `GA_MEASUREMENT_ID` — set to your GA4 ID (e.g. `G-XXXXXXXXXX`) or leave `null`.

When `GA_MEASUREMENT_ID` is set, `main.js` loads gtag and fires a `waitlist_click` event when someone clicks **Join the waitlist**.

### Conversion rate (>10% target)

1. Enable GA4 on the deployed site (`GA_MEASUREMENT_ID`).
2. In GA4, mark `waitlist_click` as a key event (or compare clicks to Form submissions).
3. Visitors = sessions; sign-ups = Form responses.

| Playbook metric | Target | How |
|-----------------|--------|-----|
| Email sign-ups (2 weeks) | ≥100 (strong), &lt;30 weak | Form response count |
| Landing conversion | &gt;10% | GA sessions → Form submissions |
| Audience fit (follow-up) | &gt;50% Docker web apps | Optional Form field + survey |

## Run on a VPS with SoloEnv

Dogfood the landing page with [SoloEnv](https://github.com/fleames/soloenv-cli): one command for a public HTTPS URL, optional password, auto teardown.

**On the VPS** (Ubuntu/Debian example):

```bash
# Docker + SoloEnv (pick one install method)
curl -fsSL https://get.docker.com | sh
go install github.com/fleames/soloenv-cli@latest
# or download soloenv from https://github.com/fleames/soloenv-cli/releases

git clone https://github.com/fleames/soloenv-landing.git
cd soloenv-landing

# Edit config.js — set FORM_URL before sharing publicly
nano config.js

# Public URL, password-protected, runs in background, expires in 7 days
soloenv up --detach --protect --ttl 168h
```

Useful commands:

```bash
soloenv status    # URL, auth, expiry
soloenv open      # open in browser (on machine with a desktop)
soloenv logs -f   # nginx container logs
soloenv down      # stop tunnel + container
```

The included [`compose.yaml`](compose.yaml) serves the site with nginx on port **8088** (mapped to container port 80). SoloEnv auto-detects that port.

## Deploy

### Netlify

1. New site → Import from Git (or drag-and-drop the `soloenv-landing` folder).
2. **Publish directory:** `soloenv-landing` (if repo root is idea-factory) or `.` if deploying only this folder.
3. **Build command:** leave empty (static).
4. Set `FORM_URL` in `config.js` before deploy (or use build-time env if you add a small build step later).

### Vercel

1. Import project → set **Root Directory** to `soloenv-landing`.
2. Framework preset: Other (no build).
3. Deploy.

### GitHub Pages

Option A — project site from `/docs`:

1. Copy contents of `soloenv-landing` into `docs/` on `gh-pages` branch, or configure Pages to publish from `/soloenv-landing` if your repo settings allow a subfolder (GitHub Pages from `/docs` at repo root is simplest: symlink or copy files).

Option B — dedicated branch:

```powershell
git subtree push --prefix soloenv-landing origin gh-pages
```

Set Pages source to that branch.

## Launch checklist

- [ ] `FORM_URL` set in `config.js` (not `YOUR_FORM_ID`)
- [ ] CTA opens Form on desktop and mobile
- [ ] Optional: `GA_MEASUREMENT_ID` set and `waitlist_click` visible in GA4 DebugView
- [ ] Share on r/SideProject, r/webdev, r/Docker and Twitter (playbook Week 1)
- [ ] Track Form responses daily in Google Sheets

## Files

| File | Role |
|------|------|
| `index.html` | Page structure and copy |
| `styles.css` | Dark theme, mobile-first layout |
| `config.js` | Form URL and GA4 ID |
| `main.js` | Waitlist click handler and optional analytics |

## Out of scope

This folder does not include the SoloEnv CLI, Wizard of Oz demos, or Idea Factory integration. Those are separate validation experiments.
