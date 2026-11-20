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
| Quick Check | screener | Toolkit v2.0: 5 items 0–3, rubric, 5-second wait, card mat, bonus, mode, engagement, second screen |
| Stop check | classroom teacher | Watched children, Yes/No per STOP, help behaviours, notes |
| Results | tech / everyone | Totals, levels, stop check, Big 5 evidence by domain, game log, reader-level log, CSV (no names) |
| Tomorrow | lesson lead | Plan for the next school day, box by box, each change with its reason; groups; per-child focus; family note; **Set up the board for tomorrow** |
| Class · Child | everyone | Profiles, supports, readiness group, Big 5 Sep → Dec, last four lessons, checklist with where each mark came from |
| Big 5 | everyone | Class × domain levels, indicator counts, how each lesson activity feeds the Big 5 |
| Setup | tech | Session date, roster, Supabase sync, clear scores, demo roster |

### Lesson day (Dec 1) is the pilot, unchanged underneath
`public/runtime/` holds the We Help! pilot's own runtime files, copied as-is from `../we-help-pilot/site/js`:
`store.js` (local mode, or Supabase sync with an offline queue, plus the portal ⇄ board link), `scoring.js`,
`screen-items.js`, `config.js`, `board-link.js` and the vendored Supabase client. `public/board/` is the pilot board.
The only change: `DEMO_NAMES` in `store.js` lists the 8 platform demo children. So:
- every board command, log and rule behaves as in the pilot portal (same `window.board` commands, same fields);
- it uses **the same Supabase project, tables and access rules** (`supabase/migrations/`, copied from the pilot);
  follow the pilot README's "Supabase setup" to connect, then Setup → Sync on each iPad;
- the pilot portal at `../we-help-pilot` still works on the same data and stays the fallback for Dec 1.

When the pilot changes one of these files, copy it over again (`cmp` should only differ on `DEMO_NAMES` in `store.js`).

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
- `components/`: shell, class panel, card mat, chart, small UI pieces
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
