// The drill sets. Each set is a list of recipes; a recipe deals one kind of hand and
// returns a question, or null to try again. buildSet() turns a set into 25 questions.
//
// A question looks like:
//   { dealer, hand, partner, steps: [{calls, ans, note}], calls, pn, contract }
// where steps are the calls the user must make, calls is the whole auction,
// pn is partner's calls with reasons, and contract is the final contract (or null).
//
// NOTE: the order of recipes matters. The deal for a given seed depends on it, so
// reordering or editing recipes changes every user's hands (saved progress is reset).
'use strict';

// ---------- Turning a deal into a question ----------
// Does hand h open with bid b (a call string, or a RegExp)?
const opensAs = b => h => {
  const o = openingBid(h);
  return !!o && (typeof b === 'string' ? o.bid === b : b.test(o.bid));
};
// Play the auction; keep it only if South makes at least `min` calls.
function deep(hS, hN, dealer, note, min) {
  if (!hS || !hN) return null;
  const sim = simulate(hS, hN, dealer, note);
  if (sim.steps.length < (min || 2)) return null;
  return { dealer, hand: hS, partner: hN, steps: sim.steps, calls: sim.calls, pn: sim.pn, contract: sim.contract };
}
// A one-call question (competitive drills): partner's hand is not shown.
function single(q) {
  return q && { dealer: q.dealer, hand: q.hand, partner: null, steps: [{ calls: q.calls, ans: q.ans, note: q.note }], calls: q.calls.concat(q.ans.bid), pn: [], contract: null };
}
const Q = (dealer, calls, hand, ans, note) => ({ dealer, calls, hand, ans, note: note || '' });

// ---------- Recipe helpers ----------
// SO: South opens. South gets lensF lengths with lo..hi HCP (and must pass ok, if given).
//     North gets pLo..pHi HCP with lengths from pSpec(rng, southHand) (default any shape).
//     min = how many calls South must make for the hand to count.
const SO = (lensF, lo, hi, pLo, pHi, min, pSpec, ok) => rng => {
  const h = deal(rng, lensF(rng), lo, hi);
  if (!h || (ok && !ok(h))) return null;
  if (!openingBid(h)) return null;
  const n = dealOther(rng, h, pSpec ? pSpec(rng, h) : sp({}, [0, 6]), pLo, pHi);
  return deep(h, n, 'S', 'You are dealer.', min);
};
// PO: Partner (North) opens. f(rng) returns
//     { s: [southLengths, lo, hi], p: [northSpec, lo, hi, northOpening], note }.
const PO = (min, f) => rng => {
  const c = f(rng);
  if (!c) return null;
  const h = deal(rng, c.s[0], c.s[1], c.s[2]);
  if (!h) return null;
  const n = dealOther(rng, h, c.p[0], c.p[1], c.p[2], opensAs(c.p[3]));
  return deep(h, n, 'N', c.note, min);
};

const nmaj = r => rl(r, sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]));   // no 4-card major
const majSpec = r => sp({ 2: [2, 6], 3: [2, 6] }, [0, 5]);
const NT1 = { p: ['bal', 15, 17, '1N'], note: 'Partner opened 1NT (15-17).' };
const anyMajor = r => ri(r, 2, 3);
// Partner of a weak-two opener: 14-17 HCP, 0-3 cards in opener's major.
const wtPartner = (r, h) => { const M = L(h)[2] === 6 ? 2 : 3; return sp({ [M]: [0, 3] }, [1, 5]); };
const sixCardMajor = r => { const s = ri(r, 2, 3); return rl(r, sp({ [s]: [6, 6] }, [0, 4])); };

const SETS = [
  {
    id: 'open-bal', name: 'Opening: balanced hands', refs: 'Opening · A · D · E',
    blurb: 'Open, then keep going: NT rebids, Stayman and transfer answers, 2NT and 2♣ follow-ups.',
    recipes: [
      SO(r => balL(r), 12, 14, 6, 15),                       // 1m, then rebid
      SO(r => balL(r), 12, 14, 6, 15),
      SO(r => balL(r), 15, 17, 0, 15, 2, majSpec),           // 1NT, then answer partner
      SO(r => balL(r), 15, 17, 0, 15, 2, majSpec),
      SO(r => balL(r), 15, 17, 0, 15, 2, majSpec),
      SO(r => balL(r), 18, 19, 5, 12),                       // 1m, then 2NT/3NT rebid
      SO(r => balL(r), 18, 19, 5, 12),
      SO(r => balL(r), 20, 22, 0, 10, 2, majSpec),           // 2NT
      SO(r => balL(r), 20, 22, 0, 10, 2, majSpec),
      SO(r => balL(r), 23, 27, 0, 7),                        // 2♣
      SO(r => balL(r, [[5, 3, 3, 2]]), 11, 14, 6, 15),       // 5332
      SO(r => balL(r), 3, 11, 0, 15, 1),                     // too weak: pass
    ],
  },
  {
    id: 'open-unbal', name: 'Opening: unbalanced hands', refs: 'Opening · B · D · E',
    blurb: 'Open, hear partner, then rebid: raises, reverses, jump shifts, weak-two answers.',
    recipes: (() => {
      const ub = h => !isBal(h);
      const fiveMajor = r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [0, 5])); };
      return [
        SO(fiveMajor, 11, 16, 4, 16, 2, null, ub),
        SO(fiveMajor, 11, 16, 4, 16, 2, null, ub),
        SO(r => rl(r, sp({ 2: [5, 5], 3: [5, 5] }, [0, 3])), 10, 17, 4, 14, 2, null, ub),   // 5-5 majors
        SO(r => rl(r, sp({ 2: [0, 4], 3: [0, 4] }, [0, 6])), 11, 14, 6, 14, 2, null, ub),   // minor openings
        SO(r => rl(r, sp({}, [1, 6])), 15, 19, 6, 12, 2, null, ub),                        // reverses, jump rebids
        SO(r => rl(r, sp({}, [1, 6])), 15, 19, 6, 12, 2, null, ub),
        SO(r => rl(r, sp({}, [1, 6])), 20, 22, 4, 12, 2, null, ub),                        // jump shifts
        SO(r => shuffle(r, [4, 4, 4, 1]), 12, 20, 6, 14, 2),
        SO(sixCardMajor, 5, 10, 14, 17, 2, wtPartner),                                     // weak two, 2NT ask
        SO(r => rl(r, sp({}, [0, 6])), 23, 26, 0, 7, 2, null, ub),                         // 2♣
        SO(r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [7, 8] }, [0, 3])); }, 3, 10, 0, 15, 1),   // pre-empts
      ];
    })(),
  },
  {
    id: 'nt-resp', name: 'Responding to 1NT', refs: 'A',
    blurb: 'Stayman, transfers, Smolen, the 2♠ range-ask and what you bid next.',
    recipes: (() => {
      // South holds `t` cards in one major M and `o` in the other.
      const maj = (t, o, def, lo, hi) => PO(2, r => { const M = anyMajor(r); return { ...NT1, s: [rl(r, sp({ [M]: t, [5 - M]: o }, def)), lo, hi] }; });
      return [
        PO(1, r => ({ ...NT1, s: [nmaj(r), 9, 17] })),        // no major: invite, game, quantitative
        PO(1, r => ({ ...NT1, s: [nmaj(r), 9, 17] })),
        PO(2, r => ({ ...NT1, s: [nmaj(r), 8, 8] })),         // 2♠ range-ask
        maj([4, 4], [2, 4], [2, 5], 8, 15),                   // Stayman
        maj([4, 4], [2, 4], [2, 5], 8, 15),
        maj([5, 5], [1, 3], [1, 5], 0, 14),                   // 5-card transfer
        maj([5, 5], [1, 3], [1, 5], 6, 14),
        maj([6, 6], [0, 3], [0, 4], 2, 9),                    // 6-card transfer
        maj([6, 7], [0, 3], [0, 4], 10, 15),                  // Texas
        maj([5, 5], [4, 4], [1, 3], 0, 13),                   // 5-4 majors: Stayman, Smolen
        maj([5, 5], [4, 4], [1, 3], 0, 13),
        PO(2, r => { const m = ri(r, 0, 1); return { ...NT1, s: [rl(r, sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3])), 0, 7] }; }),   // weak long minor
      ];
    })(),
  },
  {
    id: 'nt-open', name: 'Opening 1NT and 2NT', refs: 'A · E',
    blurb: 'You open and answer partner: Stayman, transfers, invitations, Smolen, range-ask.',
    recipes: [
      SO(r => balL(r), 15, 17, 6, 15, 2, majSpec),
      SO(r => balL(r), 15, 17, 6, 15, 2, majSpec),
      SO(r => balL(r), 15, 17, 6, 15, 2, majSpec),
      SO(r => balL(r), 15, 17, 6, 15, 2, majSpec),
      SO(r => balL(r), 15, 17, 8, 9, 2),                                                    // invitations
      SO(r => balL(r), 15, 17, 0, 7, 2, r => { const m = ri(r, 0, 1); return sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3]); }),   // weak long minor
      SO(r => balL(r), 20, 22, 0, 10, 2, majSpec),                                          // 2NT
      SO(r => balL(r), 20, 22, 0, 10, 2, majSpec),
    ],
  },
  {
    id: 'major-resp', name: 'Responding to 1♥/1♠', refs: 'B · D · G',
    blurb: 'Raises and game tries, Jacoby 2NT through RKCB, and bidding after opener rebids.',
    recipes: (() => {
      // South has t = [min, max] cards in partner's major and lo..hi HCP.
      // h4s: partner opened 1♥ and South has 4-5 spades.
      const M1 = (t, lo, hi, min, h4s) => PO(min, r => {
        const M = h4s ? 2 : anyMajor(r);
        const o = { [M]: t };
        if (h4s) o[3] = [4, 5];
        return { s: [rl(r, sp(o, [0, 6])), lo, hi], p: [sp({ [M]: [5, 6] }, [0, 5]), 11, 19, B(1, M)], note: `Partner opened 1${SY[M]} (5+ cards).` };
      });
      return [
        M1([3, 3], 6, 9, 2),          // simple raise
        M1([3, 3], 6, 9, 2),
        M1([3, 3], 8, 9, 2),
        M1([3, 3], 10, 12, 1),        // limit raise
        M1([4, 4], 7, 9, 1),          // 3♦
        M1([4, 5], 10, 12, 1),        // 3♣
        M1([4, 5], 13, 17, 2),        // Jacoby 2NT
        M1([4, 5], 13, 22, 2),
        M1([4, 5], 16, 22, 2),
        M1([0, 2], 6, 12, 2, true),   // 1♥-1♠
        M1([0, 2], 6, 12, 2, true),
        M1([0, 2], 11, 16, 1),        // new suit at the 2-level
        M1([5, 6], 1, 6, 1),          // weak 4-level raise
      ];
    })(),
  },
  {
    id: 'minor-resp', name: 'Responding to 1♣/1♦', refs: 'C · D',
    blurb: 'Your first response, then your second call after opener rebids.',
    recipes: (() => {
      // pp: partner is balanced 18-19 (so opener rebids 2NT).
      const m1 = (lf, lo, hi, min, pp) => PO(min, r => {
        const m = ri(r, 0, 1);
        return { s: [lf(r), lo, hi], p: pp ? ['bal', 18, 19, B(1, m)] : [sp({}, [0, 6]), 11, 19, B(1, m)], note: `Partner opened 1${SY[m]}.` };
      });
      return [
        m1(nmaj, 6, 10, 2, true),
        m1(nmaj, 6, 10, 2, true),
        m1(r => balL(r), 6, 12, 2),
        m1(r => balL(r), 6, 12, 2),
        m1(r => rl(r, sp({ 2: [4, 5], 3: [0, 4] }, [0, 5])), 6, 15, 2),   // hearts
        m1(r => rl(r, sp({ 3: [4, 5], 2: [0, 4] }, [0, 5])), 6, 15, 2),   // spades
        m1(r => rl(r, sp({}, [0, 6])), 6, 14, 2),
        m1(r => rl(r, sp({}, [0, 6])), 6, 14, 2),
        m1(nmaj, 11, 12, 1),          // 2NT
        m1(nmaj, 13, 15, 1),          // 3NT
      ];
    })(),
  },
  {
    id: 'comp', name: 'Competitive bidding', refs: 'F',
    blurb: 'One call per hand: overcalls, takeout and negative doubles, Michaels, Cappelletti.',
    recipes: (() => {
      // Overcall: RHO opens 1x.
      const OV = (lf, lo, hi) => rng => {
        const x = ri(rng, 0, 3);
        const h = deal(rng, lf(rng, x), lo, hi);
        if (!h) return null;
        const a = overcall(h, x);
        return a ? Q('E', [B(1, x)], h, a, `RHO opened 1${SY[x]}.`) : null;
      };
      // Negative double: partner opens 1o, RHO overcalls 1v.
      const NEG = weak => rng => {
        const cs = [[0, 1], [ri(rng, 0, 1), 2], [ri(rng, 0, 1), 3], [2, 3]];
        const [o, v] = pick(rng, cs);
        let o2 = {};
        if (!weak) {
          if (o === 0 && v === 1) o2 = { 2: [4, 4], 3: [4, 4] };
          else if (v === 2) o2 = { 3: [4, 4], 2: [0, 3] };
          else if (v === 3 && o <= 1) o2 = { 2: [4, 4], 3: [0, 3] };
          else o2 = { 0: [4, 6], 1: [4, 6], 3: [0, 3] };
        }
        const h = deal(rng, rl(rng, sp(o2, [0, 5])), weak ? 0 : 6, weak ? 5 : 11);
        if (!h) return null;
        const a = negDbl(h, o, v);
        return a ? Q('N', [B(1, o), B(1, v)], h, a, `Partner opened 1${SY[o]}; RHO overcalled 1${SY[v]}.`) : null;
      };
      // Advancing a takeout double: LHO opens 1x, partner doubles, RHO passes.
      const ADV = rng => {
        const x = ri(rng, 0, 3);
        const h = deal(rng, rl(rng, sp({ [x]: [0, 3] }, [0, 6])), 0, 14);
        if (!h) return null;
        const a = advance(h, x);
        return a ? Q('W', [B(1, x), 'X', 'P'], h, a, `LHO opened 1${SY[x]}; partner made a takeout double.`) : null;
      };
      // Cappelletti: RHO opens 1NT.
      const CAP = (lf, lo, hi) => rng => {
        const h = deal(rng, lf(rng), lo, hi);
        if (!h) return null;
        const a = vs1NT(h);
        return a ? Q('E', ['1N'], h, a, 'RHO opened a strong 1NT. You play Cappelletti.') : null;
      };
      // A 5-5 two-suiter for Michaels or the Unusual 2NT over 1x.
      const two = (r, x) => {
        const un = [0, 1, 2, 3].filter(s => s !== x);
        let pr;
        if (r() < .5) pr = x <= 1 ? [2, 3] : [x === 2 ? 3 : 2, ri(r, 0, 1)];
        else pr = un.slice(0, 2);
        return rl(r, sp({ [pr[0]]: [5, 6], [pr[1]]: [5, 5] }, [0, 3]));
      };
      return [
        OV((r, x) => rl(r, sp({}, [0, 6])), 8, 15),
        OV((r, x) => rl(r, sp({ [x]: [0, 2] }, [3, 4])), 12, 17),                     // takeout double
        OV((r, x) => balL(r), 15, 18),                                               // 1NT overcall
        OV((r, x) => { const s = pick(r, [0, 1, 2, 3].filter(t => t !== x)); return rl(r, sp({ [s]: [6, 6], [x]: [0, 3] }, [0, 4])); }, 6, 9),   // weak jump
        OV(two, 6, 10),
        OV(two, 16, 19),
        OV((r, x) => rl(r, sp({}, [0, 4])), 0, 9),                                   // pass
        NEG(false),
        NEG(false),
        NEG(true),
        ADV,
        ADV,
        CAP(r => rl(r, sp({ 2: [4, 5], 3: [4, 5] }, [0, 4])), 8, 14),
        CAP(r => { const M = ri(r, 2, 3), m = ri(r, 0, 1); return rl(r, sp({ [M]: [5, 6], [5 - M]: [0, 3], [m]: [4, 5] }, [0, 4])); }, 8, 14),
        CAP(r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [6, 7] }, [0, 3])); }, 8, 13),
        CAP(r => balL(r), 8, 18),
        CAP(r => rl(r, sp({ 0: [5, 6], 1: [5, 6] }, [0, 3])), 8, 13),
      ].map(f => rng => single(f(rng)));
    })(),
  },
  {
    id: 'slam', name: 'Slam bidding', refs: 'B · G',
    blurb: 'Jacoby 2NT to RKCB from both sides, key-card decisions, quantitative 4NT.',
    recipes: (() => {
      // JR: partner opens 1M, South bids Jacoby 2NT with lo..hi.
      const JR = (lo, hi) => PO(2, r => {
        const M = anyMajor(r);
        return { s: [rl(r, sp({ [M]: [4, 5] }, [1, 5])), lo, hi], p: [sp({ [M]: [5, 6] }, [1, 5]), 11, 21, B(1, M)], note: `Partner opened 1${SY[M]}.` };
      });
      // JO: South opens 1M and partner bids Jacoby 2NT.
      const fiveMajor = r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [2, 4])); };
      const jacobyPartner = (r, h) => { const M = ST.indexOf(openingBid(h).bid[1]); return sp({ [M]: [4, 5] }, [1, 5]); };
      const JO = SO(fiveMajor, 12, 21, 13, 22, 3, jacobyPartner, opensAs(/^1[HS]$/));
      const JO2 = SO(fiveMajor, 11, 21, 13, 22, 2, jacobyPartner, opensAs(/^1[HS]$/));
      return [
        JR(13, 22), JR(16, 22), JR(18, 22), JR(20, 22),
        JO, JO, JO2,
        PO(1, r => ({ ...NT1, s: [nmaj(r), 16, 17] })),                        // quantitative 4NT
        SO(r => balL(r), 15, 17, 16, 17, 2, r => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5])),   // answer 4NT
      ];
    })(),
  },
  {
    id: 'big', name: 'Strong openings & weak twos', refs: 'E',
    blurb: '2NT and 2♣ auctions from both sides, and the weak-two 2NT ask.',
    recipes: [
      PO(2, r => ({ s: [rl(r, sp({}, [0, 6])), 0, 10], p: ['bal', 20, 22, '2N'], note: 'Partner opened 2NT (20-22).' })),
      PO(2, r => { const M = anyMajor(r); return { s: [rl(r, sp({ [M]: [5, 6], [5 - M]: [0, 3] }, [0, 4])), 0, 10], p: ['bal', 20, 22, '2N'], note: 'Partner opened 2NT (20-22).' }; }),
      PO(2, r => ({ s: [rl(r, sp({}, [0, 6])), 0, 7], p: ['bal', 23, 24, '2C'], note: 'Partner opened 2♣ (23+).' })),
      PO(2, r => ({ s: [rl(r, sp({}, [0, 6])), 0, 7], p: ['bal', 23, 24, '2C'], note: 'Partner opened 2♣ (23+).' })),
      SO(r => rl(r, sp({}, [1, 6])), 23, 27, 0, 7, 2),
      SO(r => balL(r), 23, 26, 0, 7, 2),
      SO(sixCardMajor, 5, 10, 14, 17, 2, wtPartner),
      SO(sixCardMajor, 5, 10, 14, 17, 2, wtPartner),
      SO(r => balL(r), 20, 22, 0, 10, 2, majSpec),
    ],
  },
];
SETS.push({
  id: 'mixed', name: 'Mixed auctions', refs: 'All',
  blurb: 'Hands drawn from every uncontested drill, shuffled together.',
  recipes: SETS.filter(d => d.id !== 'comp').flatMap(d => d.recipes),
});

const SET_SIZE = 25;
// A recipe that fails this many times in a row is skipped for this turn, so one broken
// recipe cannot stall the whole set. Working recipes need well under 100 tries.
const MAX_MISSES = 2000;

// Deal the questions for one set. The same (set, seed) always gives the same hands.
// Returns SET_SIZE questions unless the recipes are broken (then fewer; tests catch this).
function buildSet(def, seed) {
  let hsh = 0;
  for (const c of def.id) hsh = (hsh * 31 + c.charCodeAt(0)) | 0;
  const rng = mulberry(seed * 7919 + hsh);
  const out = [], seen = new Set();
  let i = 0, g = 0, misses = 0;
  const order = shuffle(rng, def.recipes.map((_, k) => k));
  while (out.length < SET_SIZE && g < 60000) {
    g++;
    const q = def.recipes[order[i % order.length]](rng);
    if (q && q.steps && q.steps.length) {
      const key = q.hand.map(s => s.join('.')).join('|') + q.steps[0].calls.join();
      if (!seen.has(key)) { seen.add(key); out.push(q); i++; misses = 0; continue; }
    }
    if (++misses >= MAX_MISSES) { i++; misses = 0; }
  }
  return shuffle(rng, out);
}
