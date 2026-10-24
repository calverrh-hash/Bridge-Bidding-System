// Cards, calls and dealing: the building blocks every other file uses.
//
// Conventions used everywhere:
//   Suit index   0 = clubs, 1 = diamonds, 2 = hearts, 3 = spades (4 = no-trump in strains).
//   Hand         [clubs[], diamonds[], hearts[], spades[]], each a list of ranks, high first.
//   Rank         2-10 as numbers, 11 = J, 12 = Q, 13 = K, 14 = A.
//   Call         '1C'..'7N' for bids (level + strain letter), 'P' pass, 'X' double, 'XX' redouble.
'use strict';

const SY = ['♣', '♦', '♥', '♠'];                        // suit symbols
const SN = ['clubs', 'diamonds', 'hearts', 'spades'];    // suit names
const ST = 'CDHSN';                                      // strain letters, in bidding order
const BAL = [[4, 3, 3, 3], [4, 4, 3, 2], [5, 3, 3, 2]];  // balanced patterns
const RANK = { 14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: '10' };
// Suit lengths as words for explanations: NUM[6] = 'six', Num(6) = 'Six'.
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen'];
const Num = n => NUM[n][0].toUpperCase() + NUM[n].slice(1);
// 'one club', 'two clubs', 'no clubs'
const cardsOf = (n, s) => `${NUM[n]} ${n === 1 ? SN[s].slice(0, -1) : SN[s]}`;

// ---------- Random numbers ----------
// Seeded generator, so the same seed always deals the same 25 hands.
function mulberry(a) {
  return function () {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const ri = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));   // random integer a..b
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(rng, a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Calls ----------
const B = (l, s) => l + ST[s];                         // B(2, 3) -> '2S'
const bv = b => (+b[0] - 1) * 5 + ST.indexOf(b[1]);    // bid rank: 1C = 0 ... 7N = 34
// A chart answer. id names the rule and starts with its chart letter (the ref shown to the user):
// R('2C', why, 'A.stayman') is the Stayman rule in chart A.
const R = (bid, why, id) => ({ bid, why, id, ref: id.split('.')[0] });
// When the chart gives no single call, a rule returns one of these instead, saying why:
//   amb(why)  the chart allows more than one call here (ambiguous)
//   gap(why)  the chart has no call here at all
const amb = why => ({ stop: 'ambiguous', why });
const gap = why => ({ stop: 'gap', why });
const isCall = a => !!a && !a.stop;
const plain = b => b === 'P' ? 'Pass' : b === 'X' || b === 'XX' ? b : (b[1] === 'N' ? b[0] + 'NT' : b[0] + SY[ST.indexOf(b[1])]);
// Cheapest level at which strain s can be bid over the bid `after`.
function cheapest(s, after) {
  const al = +after[0], as = ST.indexOf(after[1]);
  return s > as ? al : al + 1;
}
// The last bid (not pass or double) in a list of calls, or undefined.
const lastBid = calls => [...calls].reverse().find(c => /^\d/.test(c));
// Cheapest level for strain s after the calls so far.
const cheapIn = (s, calls) => { const lb = lastBid(calls); return lb ? cheapest(s, lb) : 1; };

// ---------- Hand evaluation ----------
const hcp = h => h.reduce((a, s) => a + s.reduce((b, r) => b + (r > 10 ? r - 10 : 0), 0), 0);
const L = h => h.map(s => s.length);                    // suit lengths [C, D, H, S]
const isBal = h => {
  const k = L(h).slice().sort((a, b) => b - a).join('');
  return k === '4333' || k === '4432' || k === '5332';
};
const has = (h, s, r) => h[s].includes(r);
const shapeStr = h => [3, 2, 1, 0].map(s => h[s].length).join('-');   // spades first
const cardName = (s, r) => SY[s] + (RANK[r] || String(r));
// A stopper: A, Kx, Qxx or Jxxx.
const stop = (h, s) => {
  const n = h[s].length;
  return has(h, s, 14) || (has(h, s, 13) && n >= 2) || (has(h, s, 12) && n >= 3) || (has(h, s, 11) && n >= 4);
};
// A good suit: two of the top four honours.
const good = (h, s) => [14, 13, 12, 11].filter(r => has(h, s, r)).length >= 2;
// Longest suit, the higher-ranking one if tied; suits in excl are skipped.
function longest(h, excl) {
  let b = -1;
  for (let s = 3; s >= 0; s--) {
    if (excl && excl.includes(s)) continue;
    if (b < 0 || h[s].length > h[b].length) b = s;
  }
  return b;
}
// Losing Trick Count: in each suit, the missing A, K and Q among your top three cards
// (top two in a doubleton, top one in a singleton).
function suitLosers(s) {
  const n = s.length;
  if (!n) return 0;
  return [14, 13, 12].slice(0, Math.min(n, 3)).filter(r => !s.includes(r)).length;
}
const losers = h => h.reduce((a, s) => a + suitLosers(s), 0);
// '♠AK52 1 · ♥Q3 2 · ♦void 0 · ♣J9742 3'
const loserBreak = h => [3, 2, 1, 0].map(s => `${SY[s]}${h[s].length ? h[s].map(r => RANK[r] || r).join('') : 'void'} ${suitLosers(h[s])}`).join(' · ');

// ---------- Dealing ----------
// Random suit lengths that add to 13. spec is [[min,max] x 4]; null if none found.
function rl(rng, spec) {
  for (let t = 0; t < 20000; t++) {
    let sum = 0;
    const l = spec.map(([a, b]) => { const v = ri(rng, a, b); sum += v; return v; });
    if (sum === 13) return l;
  }
  return null;
}
// Build a length spec: sp({2: [5, 6]}, [0, 5]) = 5-6 hearts, 0-5 in each other suit.
function sp(o, def) {
  def = def || [0, 6];
  const a = [0, 1, 2, 3].map(() => def.slice());
  for (const k in o) a[k] = o[k];
  return a;
}
// Random balanced lengths, from BAL or the given patterns.
const balL = (rng, pats) => shuffle(rng, pick(rng, pats || BAL).slice());
// Deal one hand with the given suit lengths and lo..hi HCP. null if none found.
function deal(rng, lens, lo, hi) {
  if (!lens) return null;
  for (let t = 0; t < 20000; t++) {
    const h = [[], [], [], []];
    let p = 0;
    for (let s = 0; s < 4; s++) {
      const pool = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
      for (let i = 0; i < lens[s]; i++) {
        const j = i + Math.floor(rng() * (13 - i));
        const x = pool[i]; pool[i] = pool[j]; pool[j] = x;
      }
      h[s] = pool.slice(0, lens[s]).sort((a, b) => b - a);
      for (const r of h[s]) if (r > 10) p += r - 10;
    }
    if (p >= lo && p <= hi) return h;
  }
  return null;
}
// All the cards of several hands together, suit by suit.
const merge = (...hs) => [0, 1, 2, 3].map(s => hs.flatMap(h => h[s]));
// The 13 cards left over once three hands are dealt (the fourth hand).
function restHand(...hs) {
  const u = merge(...hs);
  return [0, 1, 2, 3].map(s => [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].filter(r => !u[s].includes(r)));
}
// Deal a second hand from the cards not in `used`.
// spec is a length spec or 'bal'; ok is an optional extra test on the hand.
function dealOther(rng, used, spec, lo, hi, ok) {
  const avail = [0, 1, 2, 3].map(s => [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].filter(r => !used[s].includes(r)));
  for (let t = 0; t < 4000; t++) {
    const lens = spec === 'bal' ? balL(rng) : rl(rng, spec);
    if (!lens || lens.some((n, s) => n > avail[s].length)) continue;
    const h = lens.map((n, s) => {
      const pool = avail[s].slice();
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(rng() * (pool.length - i));
        const x = pool[i]; pool[i] = pool[j]; pool[j] = x;
      }
      return pool.slice(0, n).sort((a, b) => b - a);
    });
    const p = hcp(h);
    if (p < lo || p > hi) continue;
    if (ok && !ok(h)) continue;
    return h;
  }
  return null;
}
