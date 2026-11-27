'use client';
/* Bridge between React and the We Help! runtime that the pilot already runs in class.
 *
 * public/runtime/*.js are the pilot's own files (store.js: local / Supabase sync with offline queue + board link;
 * scoring.js: the 9-point primary screen rules; screen-items.js: item wording). They load as plain scripts before React
 * starts (see app/layout.tsx), so the platform reads and writes exactly the same data the pilot portal does.
 * This file only adds types and a provider that re-renders the app when the data or the board changes.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { BASE } from './base';
export { BASE };
export const boardUrl = () => `${BASE}/board/board.html`;
export const boardImg = (p?: string | null) => (p ? `${BASE}/board/${p}` : '');

export type Mark = 'Y' | 'N' | null;
export type Obs = 'ok' | 'sup' | 'no';
export interface Student {
  id: string; no: number; name: string;
  a1?: number | null; a2?: number | null; a3?: number | null; a4?: number | null; a5?: number | null;
  r1?: number | null; r2?: number | null; r3?: number | null; r4?: number | null; r5?: number | null;
  /* 9-point screen: a1–a5 = items 3–7. Each has a status (a1_status…) and what the screener recorded (a1_words,
   * a2_count/_mode/_support, a3_steps/_in_order/_support, a4_sound, a5_anchor/_mode/_support); r-prefixed for the second screen. */
  a1_words?: string[]; a1_missed?: string[]; bonus?: string | null; zero_notes?: Record<string, string>;
  level_override?: number | null; level_override_reason?: string; level_override_by?: string;
  response_mode?: string | null; engaged?: boolean | null; engagement_note?: string;
  started_at?: string; finished_at?: string; re_started_at?: string; recorded_by?: string; screened_by?: string;
  present?: boolean; present_at?: string;
  stop?: Mark[]; help_asked?: string; help_offered?: string; support?: string; game_engaged?: boolean; game_note?: string;
  /* platform: per-box observation (✓ independent · ◐ with support · ○ not yet). Stored in students.meta when synced. */
  obs?: Record<string, Obs>;
  /* platform: teacher's own Big 5 checklist marks for this child (also in students.meta). */
  b5?: Record<string, 'obs' | 'emg' | 'not' | 'nop'>;
  [k: string]: unknown;
}
export interface LessonData {
  v: 1; demo: boolean;
  session: { id: string | null; date: string; site: string; className: string; teacher: string };
  students: Student[];
  stop: { watched: string[]; turn: number; turns: number };
  levelLog: { at: string; by: string; level: number; recommended: number | null; source: string; reason: string }[];
  activity: {
    brainBreaks: { id: string; at: string; by: string }[];
    draws: { place: string; at: string; by: string; how: string }[];
    stops: { n: number; place: string; at: string; by: string }[];
  };
}
export interface BoardState {
  cur: number; flow: boolean; word: number; letter: number; open: boolean; date: string; dateShown: boolean; introPart: string;
  /* platform board: how much of the date is filled in (0–4: weekday, month, day, year) and the pieces */
  dateStep?: number; dateParts?: { weekday: string; month: string; day: number; year: number };
  here: number; total: number; names?: string[]; bb: string | null; phase: string; place: number | null; signal: string | null; spinning: boolean;
  round: number[]; level: number | null; page: number; seq: { placed: number[]; checked: boolean };
}
export interface Me { name: string; role: 'lead' | 'screener' | 'teacher' | 'tech' | 'board' }
export interface SyncStatus {
  mode: 'local' | 'synced'; ready?: boolean; online?: boolean; pending?: number; error?: string | null; lastSync?: string | null;
  signedIn?: boolean; member?: Me | null; loaded?: boolean;
}
export type ItemStatus = 'correct' | 'attempted' | 'no_response' | 'not_administered';
export interface StudentResult {
  complete: boolean; invalid?: string; missing: number[]; not_administered: number[];
  items: { n: number; score: number | null; status: ItemStatus | null; done: boolean }[];
  start_total: number | null; partial_total: number | null; target_met: boolean | null;
  auto_level: 1 | 2 | 3 | null; level_override: 1 | 2 | 3 | null; start_level: 1 | 2 | 3 | null; needs_teacher_level: boolean;
  flags: string[]; teacher_flags: string[]; flagged_items: number[]; rescreen_needed: boolean; rescreen_done: boolean; rescreened: boolean;
  end_total: number | null; end_level: number | null; growth: number | null;
}
export interface ClassSummary {
  students: StudentResult[]; screened: number; not_screened: number; target_met: number; with_total: number; needs_teacher_level: number;
  teacher_flag_counts: Record<string, number>;
  level_counts: Record<1 | 2 | 3, number>; class_level: 1 | 2 | 3 | null; flag_counts: Record<string, number>;
  rescreen_list: number[]; stop_yes: number; stop_no: number; stop_percent: number | null;
  recommendations: { flag: string; text: string; students: number | null }[];
}
export interface StoreApi {
  mode: 'local' | 'synced';
  get(): LessonData; update(fn: (d: LessonData) => void): void; subscribe(fn: (d: LessonData, src: string) => void): void;
  me(): Me | null; setMe(m: Me | null): void; student(id: string): Student | undefined; toRec(s: Student): Record<string, unknown>;
  now(): string; reset(keepRoster: boolean): void; replaceRoster(rows: [number, string][]): void; status(): SyncStatus;
  ready: Promise<unknown>; needsSignIn?(): boolean; signIn?(e: string, p: string): Promise<unknown>; signOut(): Promise<boolean | void>;
  member?(): Me | null;
  board: { send(cmd: string, ...args: unknown[]): void; state(): BoardState | null; connected(): boolean; subscribe(fn: (s: BoardState) => void): void; ping(): void };
}
export interface ScoringApi {
  ITEMS: number[]; KEY: Record<number, string>; MAX: Record<number, number>; TARGET: number; MAX_TOTAL: number; BIG5: string[]; RESPONSE_MODES: string[];
  FLAGS: Record<string, string>; TEACHER_FLAGS: Record<string, string>; STATUS: Record<ItemStatus, string>; SUPPORT: Record<string, string>; BONUS: string[];
  ITEM_INFO: Record<number, { area: string; max: number }>;
  scoreItem(n: number, x: Record<string, unknown>): { score: number | null; status: ItemStatus } | null;
  student(rec: Record<string, unknown>): StudentResult; classSummary(recs: Record<string, unknown>[]): ClassSummary;
  missingItems(rec: Record<string, unknown>): number[]; pickerOrder(recs: Record<string, unknown>[]): number[];
  toCSV(recs: Record<string, unknown>[], date: string): string; csvFileName(date: string): string; level(t: number | null): number | null; stopPercent(yes: number, no: number): number | null;
}
export interface ScreenItem { n: number; key: string; area: string; draft: boolean; optional?: boolean; input: 'words' | 'count' | 'steps' | 'sound' | 'anchor' | 'bonus'; show: string; say: string; rule: string; mat: string[] }
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Content = any; // window.WEHELP from board-content.js (boxes, brainBreaks, places, words, letters, readers, notes…)

declare global {
  interface Window {
    WeHelpStore: StoreApi; WeHelpScoring: ScoringApi; WEHELP: Content; WEHELP_ITEMS: ScreenItem[];
    WEHELP_CARDS: Record<string, { img: string | null; color: string; glyph: string }>; WEHELP_CONFIG: { supabaseUrl: string; supabaseAnonKey: string; sessionDate: string };
  }
}

export const St = () => window.WeHelpStore;
export const Sc = () => window.WeHelpScoring;
export const C = () => window.WEHELP;

export function students(): Student[] { return St().get().students.slice().sort((a, b) => a.no - b.no); }
export function result(s: Student): StudentResult { return Sc().student(St().toRec(s)); }
export function summary(): ClassSummary { return Sc().classSummary(students().map(St().toRec)); }
export function meName() { return St().me()?.name || ''; }
/** Change one student and stamp who recorded it (same as the pilot portal). */
export function setField(id: string, fn: (s: Student) => void) {
  St().update(d => { const s = d.students.find(x => x.id === id); if (s) { fn(s); s.recorded_by = meName(); } });
}
export const given = (v: unknown) => v !== null && v !== undefined && v !== '';

interface Rt { ready: boolean; v: number; board: BoardState | null; connected: boolean; status: SyncStatus | null }
const Ctx = createContext<Rt>({ ready: false, v: 0, board: null, connected: false, status: null });

let wired = false;
const listeners = new Set<() => void>();
function wire() {
  if (wired || typeof window === 'undefined' || !window.WeHelpStore) return;
  wired = true;
  const St = window.WeHelpStore, bump = () => listeners.forEach(f => f());
  St.subscribe(() => bump());
  St.board.subscribe(() => bump());
  St.board.ping();
  setInterval(bump, 4000); // keeps "Board connected" honest when the board goes quiet
}

export function RuntimeProvider({ children }: { children: ReactNode }) {
  const [rt, setRt] = useState<Rt>({ ready: false, v: 0, board: null, connected: false, status: null });
  useEffect(() => {
    if (!window.WeHelpStore) { console.error('We Help! runtime did not load'); return; }
    wire();
    let alive = true;
    const read = () => { if (!alive) return; const St = window.WeHelpStore;
      setRt(r => ({ ready: true, v: r.v + 1, board: St.board.state(), connected: St.board.connected(), status: St.status() })); };
    listeners.add(read);
    window.WeHelpStore.ready.then(read);
    return () => { alive = false; listeners.delete(read); };
  }, []);
  return <Ctx.Provider value={rt}>{children}</Ctx.Provider>;
}
export const useRuntime = () => useContext(Ctx);

/** Primary screen (toolkit Quick Check) flag wording for the platform. scoring.js stays exactly as the pilot ships it; it calls the five
 * lesson words "Big 5 words", which the platform calls Power Words so they never get confused with the Big 5 domains. */
export const flagText = (f: string) => (window.WeHelpScoring.FLAGS[f] || f).replace(/Big 5 words/g, 'Power Words');
export const teacherFlagText = (f: string) => window.WeHelpScoring.TEACHER_FLAGS[f] || f;
