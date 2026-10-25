# Magic Patterns — UI Design Brief & Prompts (Kulture Compass)

How to use: create a new Magic Patterns project, paste **§1 Global context prompt** first (or into project instructions), then
generate screens one at a time with the prompts in **§4**. Export as **React + Tailwind**, save each export into
`frontend/design-exports/<screen-name>/`, then run FE slice FE-3 to re-implement them with our components.

---
## 1. Global context prompt (paste first)
```
Design a professional B2B SaaS progressive web app called "Kulture Compass" (short name "Kompass").
It helps small Nigerian fashion, streetwear and lifestyle brands turn a business brief into a Cultural Growth Plan:
cultural insights, collaboration candidates, campaign concepts and measurable experiments — every recommendation
traceable to evidence retrieved from a cultural-intelligence API (Qloo), with AI interpretation clearly separated.

Personality: confident, editorial, culturally fluent, trustworthy. Think "Bloomberg terminal meets a Lagos fashion magazine" —
clean data surfaces with warm, expressive accents. NOT a generic AI chatbot. No chat bubbles.

Non-negotiable UI rules:
- Two provenance styles used everywhere:
  * "Retrieved from Qloo" = teal (#0F766E) + database icon + label text.
  * "AI-generated" = violet (#6D28D9) + sparkle icon + label text.
- Never show invented metrics, fake follower counts, fake charts, or percentage "confidence" scores.
  Evidence strength is a pill: Strong / Moderate / Weak (with tooltip "Heuristic, not a probability").
- Use clearly fictional sample names (e.g. brand "Eko Thread Co.", entities "Sample Artist A", "Sample Brand B").
- Mobile-first, responsive (390px phone, 768px tablet, 1440px desktop). Bottom tab bar on mobile, left sidebar on desktop.
- Accessible: 4.5:1 contrast, visible focus rings, labels on all inputs, icons always paired with text.
- Tailwind CSS, lucide icons, Inter for body, Space Grotesk for headings, JetBrains Mono for evidence keys like "ev_004".
- Support light and dark mode.
```

## 2. Design tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#FAF7F2` (warm paper) | `#0F0E1F` | app background |
| `--surface` | `#FFFFFF` | `#1A1833` | cards |
| `--surface-muted` | `#F3EEE6` | `#24213F` | sections, table header |
| `--border` | `#E7E1D8` | `#34305A` | |
| `--ink` | `#14122B` | `#F4F1EA` | primary text |
| `--ink-muted` | `#5B5880` | `#B9B5D6` | secondary text |
| `--primary` | `#C2410C` (terracotta) | `#FB923C` | primary buttons, active nav |
| `--primary-ink` | `#FFFFFF` | `#14122B` | text on primary |
| `--accent` | `#F2A20C` (compass amber) | `#FBBF24` | highlights, illustration only (not text on white) |
| `--evidence` / `--evidence-bg` | `#0F766E` / `#E6F4F2` | `#2DD4BF` / `#0F2E2B` | Retrieved from Qloo |
| `--ai` / `--ai-bg` | `#6D28D9` / `#F1EBFD` | `#A78BFA` / `#251A45` | AI-generated |
| `--strong` | `#15803D` | `#4ADE80` | quality pill |
| `--moderate` | `#B45309` | `#FBBF24` | quality pill |
| `--weak` | `#6B7280` | `#9CA3AF` | quality pill |
| `--warning-bg` | `#FEF3C7` | `#3A2A05` | limitations banner |
| `--danger` | `#B91C1C` | `#F87171` | errors |
| `--focus` | `#2563EB` | `#93C5FD` | focus ring |
| Radius | 12px cards, 10px inputs, 999px pills | | |
| Shadow | `0 1px 2px rgba(20,18,43,.06), 0 8px 24px rgba(20,18,43,.06)` | none + border | |
| Spacing | 4px grid; page gutter 16px mobile / 32px desktop; max content width 1200px | | |
| Type scale | 12 / 14 / 16 / 18 / 22 / 28 / 36 / 48 (Space Grotesk 600 for ≥ 22) | | |

Logo mark: a minimal compass rose whose north needle forms a stylised "K", amber needle on ink circle. Wordmark "Kulture Compass" in Space Grotesk 600.
Decorative motif: an original, abstract geometric line pattern inspired by hand-dyed textile grids, used at 6 % opacity in the landing hero and empty states only.

## 3. Core components to generate first (prompt: "Create a component sheet with…")
```
Create a component sheet for Kulture Compass using the global context:
1. Buttons: primary, secondary (outline), ghost, destructive; sizes sm/md/lg; loading + disabled states.
2. ProvenanceLabel: two variants — "Retrieved from Qloo" (teal, database icon) and "AI-generated" (violet, sparkle icon).
3. EvidenceChip: mono key "ev_004" + entity name + small type icon (artist/brand/place/tv/podcast/tag); teal outline; hover/focus states.
4. QualityPill: Strong / Moderate / Weak with tooltip "Heuristic based on how this was retrieved — not a probability."
5. AffinityBar: thin horizontal bar labelled "Affinity 0.87" (only shown when a value exists).
6. Card variants: InsightCard (Finding block in teal-tinted panel labelled Retrieved evidence, then "Why it matters" block in
   violet-tinted panel labelled AI-generated, evidence chips row, assumptions disclosure), CollaborationCard, CampaignCard, ExperimentCard.
7. Banners: MockMode ("MOCK DATA — not real Qloo intelligence"), Sample ("Sample plan · synthetic data"), Offline, Limitations (amber),
   Error (red, with Retry).
8. Stepper (vertical) with states pending/active/done/skipped/failed and a small detail line.
9. Form fields: text, textarea with counter, select, segmented cards for objective, chip input for references with kind dropdown.
10. Empty state, skeleton loaders, toast, drawer (right side desktop / bottom sheet mobile).
Show light and dark versions.
```

## 4. Screen prompts
### 4.1 Landing page
```
Design the public landing page for Kulture Compass (desktop 1440 + mobile 390).
Sections: (1) Hero — headline "Find your culture. Grow your brand.", subcopy "Turn your brand brief into a cultural growth plan
backed by real taste data — insights, collaborations, campaigns and experiments you can test.", primary CTA "Get started free",
secondary CTA "See a sample plan"; right side shows a stylised plan preview card with teal evidence chips and violet AI labels.
(2) "How it works" — 3 steps: Tell us about your brand → We research cultural affinities with Qloo → You get a plan with evidence.
(3) "Evidence, not guesswork" — split illustration contrasting Retrieved from Qloo vs AI-generated labels; honest note:
"Affinities show shared tastes, not guaranteed sales."
(4) Who it's for — streetwear labels, fashion designers, lifestyle brands in Lagos, Abuja and beyond.
(5) Install the app — PWA badge "Works on your phone, even offline for saved plans".
(6) Footer — product, privacy, "Powered by Qloo cultural intelligence" text credit.
No fake testimonials, no fake customer logos, no invented statistics.
```
### 4.2 Sign in / Create account
```
Design Sign in and Create account pages (split layout desktop, single column mobile). Left panel: logo, tagline, subtle textile
line pattern. Right: card with email + password fields (show/hide password toggle), "Create account" adds display name (optional)
and a live password-rules checklist (10+ characters, mix of letters, numbers, symbols). Primary button with loading state, link to
switch between sign in / create account, "Continue to sample plan without an account" link. Error states: "Email or password is
incorrect", "Too many attempts — try again in 15 minutes", "An account with this email already exists". No social login buttons,
no "Forgot password" link (not in MVP).
```
### 4.3 App shell + Saved plans (empty and populated)
```
Design the authenticated app shell: desktop left sidebar (logo, "Saved plans", "New brief", "Evaluation" (dev badge), account menu
with "Install app", "Remove offline copies", "Sign out"); mobile bottom tab bar (Plans, New, Account). Top bar shows quota
"7 of 10 plans left today" and an offline indicator.
Saved plans page: list/grid of plan cards — brand name, headline, status chip (Queued / Running / Completed / Completed with limitations /
Failed), created date, counts (insights, collaborations, campaigns, experiments), "Offline copy" badge when saved offline, and a
"MOCK" badge variant. Filters: profile select, status select. Pagination.
Also design the empty state: illustration with compass motif, "No plans yet", CTA "Create your brand brief".
```
### 4.4 Business brief form (multi-step)
```
Design a 5-step brand brief form (stepper at top on desktop, compact "Step 2 of 5" on mobile):
1 Brand: brand name, category (Streetwear, Fashion, Lifestyle, Beauty, Footwear & Accessories, Other + text), short description, brand identity (tone/aesthetic).
2 Products & market: products description (counter 1000), target market, primary location with suggestion chips (Lagos, Abuja, Port Harcourt, Ibadan, Kano, Enugu).
3 Goals: marketing objective as selectable cards (Awareness, Engagement, Sales, Launch, Community, Partnerships), notes, budget range in NGN
  (Under ₦100k, ₦100k–₦500k, ₦500k–₦2m, Over ₦2m, Not sure).
4 Cultural references (optional): chip input "Brands, artists, places or shows your customers love" with a kind dropdown per chip
  (Brand, Artist, Person, Place, Media); helper text "We'll look these up in Qloo — unmatched names will be listed, not guessed."
5 Review: summary cards with Edit links; buttons "Save brief" and primary "Save & generate plan".
Show inline validation errors and a server error banner state.
```
### 4.5 Generate + research progress
```
Design (a) Generate screen: brief summary card, options (include collaborations toggle, max campaigns 1–3), quota note, primary button
"Generate cultural growth plan", disabled-offline state with explanation "Generating needs a connection to our research service".
(b) Progress screen: vertical stepper with real stages — Interpreting brief, Planning research, Retrieving evidence from Qloo
("4 of 9 Qloo requests complete"), Evaluating evidence, Generating recommendations, Validating output, Designing experiments, Saving.
Show active, done, failed states; an honest note "Usually takes 30–90 seconds. You can leave this page — we'll keep working."
Failed state: user-safe message, buttons "Edit brief" and "Try again". No fake percentage progress bar.
```
### 4.6 Plan dashboard — Overview tab
```
Design the Growth Plan page (desktop two-column, mobile single column) for fictional brand "Eko Thread Co.".
Header: brand name, plan headline, status chip, created date, actions (Make available offline toggle, Regenerate, Share disabled "coming soon").
Tabs: Overview, Insights, Collaborations, Campaigns, Experiments, Evidence.
Overview: summary paragraph (AI-generated label), "Evidence at a glance" (counts by quality: Strong 12, Moderate 9, Weak 4 — real counts
style, no charts of invented data), top 3 insights preview, top collaboration, top campaign, Limitations panel in amber
("Qloo returned few results for Lagos venues; local venue ideas omitted."), and a "Completed with limitations" banner variant.
Also show the Mock banner variant.
```
### 4.7 Insights & Collaborations tabs
```
Design Insights tab: list of InsightCards — title, Finding block (teal, "Retrieved from Qloo") with evidence chips, "Why it matters" block
(violet, "AI-generated"), evidence strength pill, collapsible Assumptions and Limitations.
Design Collaborations tab: CollaborationCards — partner name with entity-type icon and its evidence chip (teal), cultural connection,
proposed format (e.g. capsule drop, co-hosted listening party), fit rationale (AI-generated), "How to test it" box, strength pill.
Add an "AI suggestions not found in Qloo" box listing unlinked names with a neutral grey style and explanation.
```
### 4.8 Campaigns & Experiments tabs
```
Design Campaigns tab: CampaignCards with objective, target hypothesis, cultural insight (with evidence chips), angle, execution steps
(numbered), success metric, effort badge (Low/Medium/High), assumptions.
Design Experiments tab: ExperimentCards as structured mini-briefs — Hypothesis, Segment, Proposed campaign, Primary metric, Measurement
period (e.g. 14 days), Success threshold with a "Proposed default" badge, Decision rule (If success → …, If not → …), linked recommendation
link, status chip (Proposed/Running/Concluded) and a "Record result" button opening a dialog (status, observed result, notes).
```
### 4.9 Evidence tab + Evidence drawer
```
Design Evidence tab: filter bar (type, quality, search), table on desktop / cards on mobile with columns: key (mono), name, type,
affinity (bar only when value exists, otherwise "—"), popularity, quality pill, source signal. Above the table, a simple horizontal bar
chart "Top affinities returned by Qloo" (values shown as numbers).
Design Evidence drawer (right sheet desktop, bottom sheet mobile): name, type/subtype, key, "Retrieved from Qloo" label, affinity &
popularity values, tags, quality pill with reasons list ("user seed: Sample Artist A", "affinity 0.91 ≥ 0.80", "seen in 2 operations"),
source signals, retrieved timestamp, and "Used in" list of recommendations linking back.
```
### 4.10 Evaluation (developer/judge mode)
```
Design an Evaluation page labelled "Evaluation mode (for judges & developers)". Choose a brief → Run comparison.
Result: neutral metrics table comparing "Qloo-grounded" vs "LLM-only" — named entities, traceable to retrieved evidence, unsupported
named entities, recommendations with evidence, numeric claims not in inputs, avg entities per recommendation, brief-term coverage.
No winner badges; caveat note "LLM-only output cannot cite retrieved evidence by construction." Below, side-by-side columns of both
outputs with highlighted unsupported names. Reviewer notes textarea.
```
### 4.11 Offline, 404, install & update prompts
```
Design: Offline page ("You're offline" + list of offline copies + explanation that generation needs a connection); 404 page with compass
motif; Install prompt card (bottom on mobile, corner on desktop) "Install Kulture Compass for quick access" with Install / Not now;
iOS instructions sheet (Share icon → Add to Home Screen); Update toast "A new version is available — Reload".
```

## 5. Export checklist
- Export React + Tailwind per screen → `frontend/design-exports/<nn-screen>/`.
- Note any Magic Patterns-specific dependencies — we won't install them; FE-3 re-implements with Radix + our tokens.
- Check every mock name is fictional, no fake metrics slipped in, provenance colours used consistently.
