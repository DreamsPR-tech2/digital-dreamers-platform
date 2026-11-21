/* The 8 children of the demo class. ALL FICTIONAL. No real child, family, teacher or agency information belongs here.
 *
 * A profile is matched to a roster entry by first name (the roster itself lives in the We Help! store, so on lesson
 * day a real roster loaded in Setup simply has no profile or history: the platform then shows only what is recorded
 * live, and nothing is invented).
 *
 * History before Dec 1:
 *  - b5Sept: the Initial (Sept.) Big 5 checkpoint, one status per indicator.
 *  - lessons: independence % in the four lessons before this one (the last is Unit 2 · We Are Friends, Nov 10).
 *  - months: Big 5 composite (0–100) at the end of Sep, Oct and Nov.
 */
import type { B5Status } from './big5.ts';

export type Home = 'es' | 'en' | 'bi';
export interface Child {
  id: string; name: string; age: number; home: Home; color: string;
  tag: string; mode: string; modes: string[]; supports: string[]; strengths: string;
  joined?: string;
  b5Sept: Record<string, B5Status>;
  lessons: (number | null)[];  // independence % · Oct 20, Oct 27, Nov 3, Nov 10 (null = not enrolled yet)
  months: Record<string, (number | null)[]>; // per Big 5 domain: Sep, Oct, Nov composite (null = no data)
  family: string;
}

export const PAST_LESSONS = [
  { date: 'Oct 20', title: 'All About Me · Mi familia' },
  { date: 'Oct 27', title: 'All About Me · Mi cuerpo' },
  { date: 'Nov 3', title: 'We Are Friends · Somos amigos (day 1)' },
  { date: 'Nov 10', title: 'We Are Friends · Somos amigos (Block II)' },
];

// helper: a status string per domain, 4 indicators each, in bk1..bk4 · ol1..ol4 · pa1..pa4 · ak1..ak4 · cp1..cp4 order.
// o = observed · e = emerging · n = not yet · - = no chance to observe
function sept(s: string): Record<string, B5Status> {
  const map: Record<string, B5Status> = { o: 'obs', e: 'emg', n: 'not', '-': 'nop' };
  const ids = ['bk', 'ol', 'pa', 'ak', 'cp'].flatMap(d => [1, 2, 3, 4].map(i => d + i));
  const flat = s.replace(/\s/g, '');
  return Object.fromEntries(ids.map((id, i) => [id, map[flat[i]] ?? 'nop']));
}

export const CHILDREN: Child[] = [
  { id: 'natalia', name: 'Natalia', age: 5, home: 'es', color: '#0F5DB8',
    tag: 'Spanish-dominant', mode: 'Speech', modes: ['speech'], strengths: 'Retells stories in detail; helps friends find their place.',
    supports: ['Model in Spanish first, then English', 'Bilingual partner for new words'],
    b5Sept: sept('oooe oeoo eeoe ooee oeoo'), lessons: [72, 76, 81, 84],
    months: { bk: [78, 84, 88], ol: [66, 74, 80], pa: [52, 60, 68], ak: [58, 66, 72], cp: [74, 80, 86] },
    family: 'Natalia leads at home too: ask her to teach “help / ayuda” with the gesture.' },
  { id: 'joaquin', name: 'Joaquín', age: 4, home: 'es', color: '#C13540',
    tag: 'AAC + gesture communicator', mode: 'AAC board + gestures', modes: ['aac', 'gesture'], strengths: 'Strong receptive language; first to the visual schedule.',
    supports: ['AAC pre-loaded: help, do, see, go, stop + “We help”', 'Model on the device before asking', 'Accept pointing and eye gaze as answers'],
    b5Sept: sept('oeoo oene neen eene oeeo'), lessons: [48, 52, 55, 58],
    months: { bk: [62, 66, 70], ol: [34, 40, 46], pa: [22, 26, 30], ak: [30, 36, 42], cp: [48, 54, 58] },
    family: 'Practice the five words on Joaquín’s AAC board at dinner: one word per day.' },
  { id: 'zoe', name: 'Zoe', age: 5, home: 'en', color: '#A36500',
    tag: 'English-dominant', mode: 'Speech', modes: ['speech'], strengths: 'Confident speaker; strong letter knowledge.',
    supports: ['Directions in English, echo in Spanish', 'Word cards with the Spanish visible'],
    b5Sept: sept('oooo ooee oooe oooo eoeo'), lessons: [80, 82, 85, 88],
    months: { bk: [80, 84, 88], ol: [74, 80, 84], pa: [70, 76, 82], ak: [82, 86, 90], cp: [62, 68, 74] },
    family: 'Zoe can read the Level 3 story aloud to a grown-up in English, then retell it in Spanish.' },
  { id: 'mason', name: 'Mason', age: 4, home: 'bi', color: '#047869',
    tag: 'Bilingual · movement breaks', mode: 'Speech', modes: ['speech'], strengths: 'High energy and enthusiasm in movement games.',
    supports: ['Movement break before seated work', 'Short directions, one step at a time', 'Seat near the board'],
    b5Sept: sept('oeoe eoen oeee eeen oeee'), lessons: [55, 58, 62, 64],
    months: { bk: [60, 64, 68], ol: [50, 56, 60], pa: [46, 52, 58], ak: [44, 50, 54], cp: [44, 48, 52] },
    family: 'Play “Go and Stop” at home: Mason calls the STOP.' },
  { id: 'luna', name: 'Luna', age: 5, home: 'es', color: '#4b3f9e',
    tag: 'Down syndrome', mode: 'Words + signs', modes: ['speech', 'sign'], strengths: 'Joyful participant; signs HELP and STOP reliably.',
    supports: ['Extra wait time (10 s)', 'Large visuals and tactile cards', 'Seated option named aloud'],
    b5Sept: sept('eene nnne nn-n enen ennn'), lessons: [30, 34, 38, 41],
    months: { bk: [40, 44, 48], ol: [22, 26, 30], pa: [12, 16, 20], ak: [24, 28, 32], cp: [22, 26, 30] },
    family: 'Sign HELP and STOP with Luna during clean-up time.' },
  { id: 'thiago', name: 'Thiago', age: 4, home: 'bi', color: '#B4571A',
    tag: 'Autistic · regulation supports', mode: 'Speech + visual schedule', modes: ['speech', 'point'], strengths: 'Remembers routines exactly; loves the letters box.',
    supports: ['First · Next visual schedule always visible', 'Quiet corner and Five-Finger Breathing', 'Headphones offered for the game'],
    b5Sept: sept('eooe oeen eene ooee eeen'), lessons: [50, 46, 54, 57],
    months: { bk: [56, 60, 64], ol: [46, 50, 54], pa: [36, 40, 44], ak: [62, 68, 72], cp: [38, 42, 46] },
    family: 'Show Thiago tomorrow’s plan picture before school: “First Brain Break, next the game.”' },
  { id: 'elias', name: 'Elías', age: 5, home: 'bi', color: '#1C7F57', joined: 'October',
    tag: 'New in October · shy at first', mode: 'Speech + gestures', modes: ['speech', 'gesture'], strengths: 'Careful listener; answers well one-to-one.',
    supports: ['Partner echo before answering in front of the group', 'Turn signal on the table'],
    b5Sept: sept('---- ---- ---- ---- ----'), lessons: [null, 44, 50, 55],
    months: { bk: [null, 52, 58], ol: [null, 44, 50], pa: [null, 40, 46], ak: [null, 46, 52], cp: [null, 42, 48] },
    family: 'Ask Elías to “be the teacher” and show you the word cards.' },
  { id: 'aurora', name: 'Aurora', age: 4, home: 'es', color: '#6A2FA0',
    tag: 'Newcomer · English emerging', mode: 'Speech (Spanish)', modes: ['speech'], strengths: 'Strong Spanish vocabulary; understands routines quickly.',
    supports: ['Spanish bridge for every new word', 'Picture first, then the English word', 'Spanish answers count'],
    b5Sept: sept('oeee eene eeen nene eene'), lessons: [36, 40, 44, 47],
    months: { bk: [52, 56, 60], ol: [34, 38, 42], pa: [30, 34, 38], ak: [26, 30, 34], cp: [36, 40, 44] },
    family: 'Name helpers in Spanish on the way home; Aurora answers in either language.' },
];

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
export const childByName = (name: string) => CHILDREN.find(c => norm(c.name) === norm(name)) || null;
export const childById = (id: string) => CHILDREN.find(c => c.id === id) || null;
export const DEMO_NAMES = CHILDREN.map(c => c.name);
