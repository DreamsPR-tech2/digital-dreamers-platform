# Digital Dreamers Platform

Production home of the DREAMS Inclusive Early Learning Framework™ platform.
First lesson on it: **Unit 3 · We Help! / ¡Ayudamos!** (La Esperanza, Dec 1 2026), joined to the teacher experience
from the Nov 10 demo (Today · Plan · Progress · Big 5).

**All children in this repo are fictional** (8 demo children in `lib/children.ts`). No real child, family, teacher
or agency information belongs here. On lesson day the real roster lives only in Supabase and on the team's iPads.

## Run it
```bash
npm install
npm run dev            # http://localhost:8020 (live reload)
npm run build          # static site in out/, ready for any HTTPS host
npm test               # platform rules + the pilot's Quick Check scoring tests
```
Serving from a sub-folder (e.g. GitHub Pages): `NEXT_PUBLIC_BASE_PATH=/digital-dreamers-platform npm run build`.
The board is at `/board/board.html` (add `?date=2026-12-01` to rehearse).

## What it does
| Page | For | What |
|---|---|---|
| Today | everyone | Unit timeline (Unit 1 → Unit 2 Nov 10 → today → tomorrow), live tiles, who to watch, the lesson box by box |
| Lesson | lesson lead | Drives the classroom board + **class panel**: every child, every box, recorded live (✓ ◐ ○) |
| Quick Check | screener | Toolkit v2.0: 5 items 0–3, rubric, 5-second wait, item 1 by tapping the Power Words the child gets, bonus, mode, engagement, second screen |
| Stop check | classroom teacher | Watched children, Yes/No per STOP (one stop per STOP called in the game; add or remove stops), help behaviours, notes |
| Results | tech / everyone | Totals, levels, stop check, Big 5 evidence by domain, game log, reader-level log, CSV (no names) |
| Tomorrow | lesson lead | Plan for the next school day, box by box, each change with its reason; groups; per-child focus; family note; **Set up the board for tomorrow** |
| Class · Child | everyone | Profiles, supports, readiness group, Big 5 Sep → Dec, last four lessons, checklist with where each mark came from |
| Big 5 | everyone | Class × domain levels, indicator counts, how each lesson activity feeds the Big 5 |
| Setup | tech | Session date, roster, Supabase sync, clear scores, demo roster |

### Lesson day (Dec 1) is the pilot, unchanged underneath
`public/runtime/` holds the We Help! pilot's own runtime files, copied as-is from `../we-help-pilot/site/js`:
`store.js` (local mode, or Supabase sync with an offline queue, plus the portal ⇄ board link), `scoring.js`,
`screen-items.js`, `config.js`, `board-link.js` and the vendored Supabase client. `public/board/` started as the pilot board.
Changes from the pilot: `DEMO_NAMES` in `store.js` lists the 8 platform demo children, and the board's Today and Plan
boxes were reworked (see "Board changes" below). So:
- every board command, log and rule behaves as in the pilot portal (same `window.board` commands, same fields);
- it uses **the same Supabase project, tables and access rules** (`supabase/migrations/`, copied from the pilot);
  follow the pilot README's "Supabase setup" to connect, then Setup → Sync on each iPad;
- the pilot portal at `../we-help-pilot` still works on the same data and stays the fallback for Dec 1.

When the pilot changes one of these files, copy it over again (`cmp` should only differ on `DEMO_NAMES` in `store.js`).
`public/board/js/board.js` and `public/board/css/board.css` now differ from the pilot on purpose; merge pilot changes by hand.

### Board changes (platform only)
- **Today (box 1)** opens showing both parts (Who is here? + calendar). The iPad can still switch to one part.
- **Who is here?** is a list of first names, written onto the board as each child is marked here, in that order.
  This changes the pilot's rule that the board never shows names: the platform's Lesson page sends the first names
  of the children marked here with `setAttendance(here, total, names)`. In synced mode they travel over the private
  board channel; the board account still cannot read student data, and the board keeps the names in its own browser
  storage until Reset. The pilot portal sends only the count, so the board falls back to person icons.
- **Calendar:** today's date sits centred in its circle (the day cell used the class `today`, which the Plan box also
  uses; it is now `is-today`). "Today is" is larger, on the left, with the date to its right, under the calendar.
- **Plan (box 2):** each row uses the colour of the box it refers to.
- **Calendar:** “What is the date? / ¿Qué fecha es hoy?” at the top, with the answer filling in beside it when the
  iPad fills in the date. No “Calendar” label and no line under the calendar.
- **Date, piece by piece:** the iPad fills in the answer one piece at a time (weekday → month → day → year) with
  `setDateStep(0–4)`; tapping the calendar or pressing D on the board adds the next piece. The weekday column lights up
  with the weekday, the month header with the month, and today’s circle with the day. The pilot’s `showDate` still
  fills it all at once.
- **Game:** GO and STOP only (GO: everyone moves; STOP: freeze; GO again). No MOVE cue.

### Lesson-day changes from the pilot portal (platform only)
- Quick Check item 1: the screener taps the Power Words the child **gets**; the score follows. Still stored as the
  pilot's `a1_missed`, so the data and CSV are unchanged. No card mat.
- Lesson: right after STOP, the lead (or whoever has the Lesson screen) marks which watched children stopped.
  The marks are the same ones as on the Stop check tab.
- Stop check: the number of stops follows the game: the first STOP sets it to 1 and each STOP adds one. The
  teacher can add or remove stops (database range 1–20).

### New data the platform records
Saved on each child in the same store, so in synced mode it goes to `students.meta` and syncs like the pilot's other
per-child fields (no database change needed):
- `obs`: one observation per board box: `ok` (independent) · `sup` (with support) · `no` (not yet).
- `b5`: the teacher's own Big 5 checklist marks from the child record (these win over automatic evidence).

Tomorrow's saved plan is kept on the iPad that saved it (`localStorage`, `dreams-plan:v1:<date>`).

## Rules
- **Naming:** "Big 5" always means Head Start's five domains. The five lesson words (help, do, see, go, stop) are
  **Power Words**. The pilot files call them "Big 5 words"; the platform rewrites that wording when it displays it.
- **Big 5 evidence** (`lib/big5.ts`): Quick Check 1 → Oral Language (key words), 2 and 5 → Oral Language (phrases),
  3 → two-step direction, 4 → Phonological Awareness (initial sound); boxes: Today → greeting, Plan → visual schedule,
  Move together → names helpers, Word wall → key words, Letters → letter–sound, Read together → who/what,
  Comprehension → First · Next · Last. Brain Break and stop check are regulation / executive function, outside the Big 5.
  The best evidence per indicator counts (strengths-based); a second screen replaces the start score for that item.
- **Group standard** (unchanged from the Nov 10 demo): readiness = 70% Big 5 composite + 30% last-four-lesson
  independence. Advanced ≥ 68 · Progressing 45–67 · Beginning < 45.
- **Tomorrow's plan** (`lib/plan.ts`): built from the Quick Check flags, stop check, box observations and attendance.
  Every changed or new line states its reason.
- Children whose names match no profile (a real roster) get no invented history: only what is recorded live.

## Layout
- `app/`: one folder per page (Next.js App Router, static export)
- `components/`: shell, class panel, chart, small UI pieces
- `lib/`: `runtime.tsx` (typed bridge to the pilot runtime), `children.ts`, `big5.ts`, `plan.ts`, `sample.ts` (demo responses)
- `public/runtime/`, `public/board/`: the pilot runtime and board (see above)
- `supabase/`: the pilot's migrations and local dev setup
- `tests/`: `platform.test.ts` and the pilot's `scoring.test.js`

## Open items
- Spanish teacher UI (the Nov 10 demo had an ES toggle; this build is English for teachers, bilingual on the board).
- Brand fonts (Baloo 2 / Nunito per the toolkit); Poppins for now, as in the pilot.
- Design system artifact → tokens (colors here come from the Nov 10 demo).
- Indicator wording and the Quick Check → Big 5 mapping to confirm with Kristen & Cari.
- Saved plans to sync across iPads (today they stay on the iPad that saved them).
