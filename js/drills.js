// The drill sets. Each set is a list of recipes; a recipe deals one kind of hand and
// returns a question, or null to try again. buildSet() deals a pool of 100 and picks the
// 25 that cover the most different situations. Four-hand drills are in contested.js.
//
// A question looks like:
//   { dealer, hand, partner, steps: [{calls, ans, note}], calls, pn, contract, stop }
// where steps are the calls the user must make, calls is the whole auction,
// pn is partner's calls with reasons, contract is the final contract (or null), and
// stop says why the auction ended early (an amb() or gap() with its seat), or is null.
//
// NOTE: the order of recipes matters. The deal for a given seed depends on it, so
// reordering or editing recipes changes every user's hands (saved progress is reset).
'use strict';

// ---------- Turning a deal into a question ----------
// Does hand h open with bid b (a call string, or a RegExp)?
const opensAs = b => h => {
  const o = openingBid(h);
  return isCall(o) && (typeof b === 'string' ? o.bid === b : b.test(o.bid));
};
// Play the auction; keep it only if South makes at least `min` calls. If the chart stops
// early (sim.stop), the hand is still kept, and the drill shows why it ends: dropping those
// hands would lose whole topics (reverses, jump shifts, Jacoby shortness), where the chart
// covers South's call but not partner's next one.
function deep(hS, hN, dealer, note, min) {
  if (!hS || !hN) return null;
  const sim = simulate(hS, hN, dealer, note);
  if (sim.steps.length < (min || 2)) return null;
  return { dealer, hand: hS, partner: hN, steps: sim.steps, calls: sim.calls, pn: sim.pn, contract: sim.contract, stop: sim.stop };
}
// A one-call question (competitive drills): partner's hand is not shown.
function single(q) {
  return q && { dealer: q.dealer, hand: q.hand, partner: null, steps: [{ calls: q.calls, ans: q.ans, note: q.note }], calls: q.calls.concat(q.ans.bid), pn: [], contract: null, stop: null };
}
const Q = (dealer, calls, hand, ans, note) => ({ dealer, calls, hand, ans, note: note || '' });
// A one-call question in a contested auction: South's chart call after `calls`, or null to try again.
function oneCall(dealer, calls, h, note) {
  if (!h) return null;
  const a = chartCall(auctionState(dealer, calls), h);
  return isCall(a) ? single(Q(dealer, calls, h, a, note)) : null;
}

// ---------- Recipe helpers ----------
// SO: South opens.
//   south: { lens: rng => suit lengths, hcp: [lo, hi], ok: optional extra test on South's hand }
//   north: { lens: (rng, southHand) => length spec or 'bal' (default: any shape), hcp: [lo, hi],
//            ok: optional extra test on North's hand }
//   calls: how many calls South must make for the hand to count (default 2).
const SO = ({ south, north, calls = 2 }) => rng => {
  const h = deal(rng, south.lens(rng), south.hcp[0], south.hcp[1]);
  if (!h || (south.ok && !south.ok(h))) return null;
  if (!isCall(openingBid(h))) return null;
  const n = dealOther(rng, h, north.lens ? north.lens(rng, h) : sp({}, [0, 6]), north.hcp[0], north.hcp[1], north.ok);
  return deep(h, n, 'S', 'You are dealer.', calls);
};
// PO: Partner (North) opens. setup(rng) describes one deal:
//   { south: { lens: suit lengths, hcp: [lo, hi] },
//     north: { lens: length spec or 'bal', hcp: [lo, hi], opens: North's opening bid }, note }
//   calls: how many calls South must make for the hand to count (default 2).
const PO = ({ setup, calls = 2 }) => rng => {
  const c = setup(rng);
  if (!c) return null;
  const h = deal(rng, c.south.lens, c.south.hcp[0], c.south.hcp[1]);
  if (!h) return null;
  const n = dealOther(rng, h, c.north.lens, c.north.hcp[0], c.north.hcp[1], opensAs(c.north.opens));
  return deep(h, n, 'N', c.note, calls);
};

// want: keep only deals where South is asked chart rule `id` (tries a few deals per call), so
// every rule on the chart gets practised, however rare its hand.
const want = (recipe, id, tries = 40) => (rng, opts) => {
  for (let t = 0; t < tries; t++) {
    const q = recipe(rng, opts);
    if (q && q.steps.some(s => s.ans.id === id)) return q;
  }
  return null;
};
const nmaj = r => rl(r, sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]));   // no 4-card major
const majSpec = r => sp({ 2: [2, 6], 3: [2, 6] }, [0, 5]);
const NT1 = { north: { lens: 'bal', hcp: [15, 17], opens: '1N' }, note: 'Partner opened 1NT (15-17).' };
const NT17 = { north: { lens: 'bal', hcp: [17, 17], opens: '1N' }, note: 'Partner opened 1NT (15-17).' };   // a maximum
const weakMinorSpec = r => { const m = ri(r, 0, 1); return sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3]); };
const anyMajor = r => ri(r, 2, 3);
// Partner of a weak-two opener: 14-17 HCP, 0-3 cards in opener's major.
const wtPartner = (r, h) => { const M = L(h)[2] === 6 ? 2 : 3; return sp({ [M]: [0, 3] }, [1, 5]); };
const sixCardMajor = r => { const s = ri(r, 2, 3); return rl(r, sp({ [s]: [6, 6] }, [0, 4])); };
const weakTwo = SO({ south: { lens: sixCardMajor, hcp: [5, 10] }, north: { lens: wtPartner, hcp: [14, 17] } });

const SETS = [
  {
    id: 'open-bal', name: 'Opening: balanced hands', refs: 'Opening · A · D · E',
    blurb: 'Open, then keep going: NT rebids, Stayman and transfer answers, 2NT and 2♣ follow-ups.',
    recipes: (() => {
      const minor = SO({ south: { lens: balL, hcp: [12, 14] }, north: { hcp: [6, 15] } });                  // 1m, then rebid
      const nt = SO({ south: { lens: balL, hcp: [15, 17] }, north: { lens: majSpec, hcp: [0, 15] } });     // 1NT, then answer partner
      const minor1819 = SO({ south: { lens: balL, hcp: [18, 19] }, north: { hcp: [5, 12] } });             // 1m, then 2NT/3NT rebid
      const nt2 = SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } });    // 2NT
      return [
        minor, minor, nt, nt, nt, minor1819, minor1819, nt2, nt2,
        SO({ south: { lens: balL, hcp: [23, 27] }, north: { hcp: [0, 7] } }),                               // 2♣
        SO({ south: { lens: r => balL(r, [[5, 3, 3, 2]]), hcp: [11, 14] }, north: { hcp: [6, 15] } }),     // 5332
        SO({ south: { lens: balL, hcp: [3, 11] }, north: { hcp: [0, 15], ok: opensAs('P') }, calls: 1 }),  // too weak: pass, and so does partner
        want(SO({ south: { lens: balL, hcp: [12, 20] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [6, 10] } }), 'C.after-1nt', 60),   // 1m – 1NT: opener's rebid
        want(SO({ south: { lens: r => rl(r, sp({ 0: [3, 6], 1: [3, 6] }, [1, 4])), hcp: [11, 16] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [11, 12] } }), 'C.after-2nt', 60),   // 1m – 2NT: opener's rebid
      ];
    })(),
  },
  {
    id: 'open-unbal', name: 'Opening: unbalanced hands', refs: 'Opening · B · D · E',
    blurb: 'Open, hear partner, then rebid: raises, reverses, jump shifts, weak-two answers.',
    recipes: (() => {
      const ub = h => !isBal(h);
      const fiveMajor = r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [0, 5])); };
      const major = SO({ south: { lens: fiveMajor, hcp: [11, 16], ok: ub }, north: { hcp: [4, 16] } });
      const strong = SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [15, 19], ok: ub }, north: { hcp: [6, 12] } });   // reverses, jump rebids
      return [
        major, major,
        SO({ south: { lens: r => rl(r, sp({ 2: [5, 5], 3: [5, 5] }, [0, 3])), hcp: [10, 17], ok: ub }, north: { hcp: [4, 14] } }),   // 5-5 majors
        SO({ south: { lens: r => rl(r, sp({ 2: [0, 4], 3: [0, 4] }, [0, 6])), hcp: [11, 14], ok: ub }, north: { hcp: [6, 14] } }),   // minor openings
        strong, strong,
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [20, 22], ok: ub }, north: { hcp: [4, 12] } }),   // jump shifts
        SO({ south: { lens: r => shuffle(r, [4, 4, 4, 1]), hcp: [12, 20] }, north: { hcp: [6, 14] } }),
        weakTwo,                                                                                             // weak two, 2NT ask
        SO({ south: { lens: r => rl(r, sp({}, [0, 6])), hcp: [23, 26], ok: ub }, north: { hcp: [0, 7] } }),    // 2♣
        SO({ south: { lens: r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [7, 8] }, [0, 3])); }, hcp: [3, 10] }, north: { hcp: [0, 15] }, calls: 1 }),   // pre-empts
        want(SO({ south: { lens: r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [6, 7] }, [0, 4])); }, hcp: [11, 14], ok: ub }, north: { hcp: [6, 12] } }), 'D.jump-rebid-shape'),
        want(strong, 'D.double-raise', 80),                                                                  // 15-19 with 4-card support   // 7-card suit or 5 losers
        want(SO({ south: { lens: r => { const M = anyMajor(r), m = ri(r, 0, 1); return rl(r, sp({ [m]: [6, 6], [M]: [5, 5] }, [0, 2])); }, hcp: [15, 19] }, north: { hcp: [6, 12] } }), 'D.six-five'),   // 6-5, longer minor
        want(SO({ south: { lens: r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [6, 6] }, [0, 5])); }, hcp: [0, 4] }, north: { hcp: [0, 15], ok: opensAs('P') }, calls: 1 }), 'E.pass-no-weak-two'),   // too weak for a weak two
      ];
    })(),
  },
  {
    id: 'nt-resp', name: 'Responding to 1NT', refs: 'A',
    blurb: 'Stayman, transfers, Smolen, the 2♠ range-ask and what you bid next.',
    recipes: (() => {
      // South holds `t` cards in one major M, `o` in the other, `def` in each minor, and lo..hi HCP.
      const maj = (t, o, def, lo, hi) => PO({ setup: r => { const M = anyMajor(r); return { ...NT1, south: { lens: rl(r, sp({ [M]: t, [5 - M]: o }, def)), hcp: [lo, hi] } }; } });
      const noMajor = PO({ setup: r => ({ ...NT1, south: { lens: nmaj(r), hcp: [9, 17] } }), calls: 1 });   // invite, game, quantitative
      const stayman = maj([4, 4], [2, 4], [2, 5], 8, 15);
      const fiveFour = maj([5, 5], [4, 4], [1, 3], 0, 13);                                                  // Stayman, Smolen
      return [
        noMajor, noMajor,
        PO({ setup: r => ({ ...NT1, south: { lens: nmaj(r), hcp: [8, 8] } }) }),                           // 2♠ range-ask
        PO({ setup: r => ({ ...NT17, south: { lens: nmaj(r), hcp: [8, 8] } }) }),                          // range-ask opposite a maximum
        PO({ setup: r => ({ ...NT17, south: { lens: rl(r, sp({ 0: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3])), hcp: [0, 7] } }) }),   // weak clubs opposite 17
        PO({ setup: r => ({ ...NT17, south: { lens: rl(r, sp({ 1: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3])), hcp: [0, 7] } }) }),   // weak diamonds opposite 17
        stayman, stayman,
        maj([5, 5], [1, 3], [1, 5], 0, 14),                   // 5-card transfer
        maj([5, 5], [1, 3], [1, 5], 6, 14),
        maj([6, 6], [0, 3], [0, 4], 2, 9),                    // 6-card transfer
        maj([6, 7], [0, 3], [0, 4], 10, 15),                  // Texas
        fiveFour, fiveFour,
        PO({ setup: r => { const m = ri(r, 0, 1); return { ...NT1, south: { lens: rl(r, sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3])), hcp: [0, 7] } }; } }),   // weak long minor
        want(PO({ setup: r => ({ ...NT1, south: { lens: nmaj(r), hcp: [0, 7] } }), calls: 1 }), 'A.pass'),                    // too weak: pass 1NT
      ];
    })(),
  },
  {
    id: 'nt-open', name: 'Opening 1NT and 2NT', refs: 'A · E',
    blurb: 'You open and answer partner: Stayman, transfers, invitations, Smolen, range-ask.',
    recipes: (() => {
      const nt = SO({ south: { lens: balL, hcp: [15, 17] }, north: { lens: majSpec, hcp: [6, 15] } });
      const nt2 = SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } });
      const weakMinor = r => { const m = ri(r, 0, 1); return sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3]); };
      return [
        nt, nt, nt, nt,
        SO({ south: { lens: balL, hcp: [15, 17] }, north: { hcp: [8, 9] } }),                        // invitations
        SO({ south: { lens: balL, hcp: [15, 17] }, north: { lens: weakMinor, hcp: [0, 7] } }),      // weak long minor
        SO({ south: { lens: balL, hcp: [17, 17] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [8, 8] } }),   // range-ask with a maximum
        SO({ south: { lens: balL, hcp: [17, 17] }, north: { lens: weakMinorSpec, hcp: [0, 7] } }),  // weak minor opposite a maximum
        nt2, nt2,
      ];
    })(),
  },
  {
    id: 'major-resp', name: 'Responding to 1♥/1♠', refs: 'B · D · G',
    blurb: 'Raises and game tries, Jacoby 2NT through RKCB, and bidding after opener rebids.',
    recipes: (() => {
      // South has t = [min, max] cards in partner's major and lo..hi HCP.
      // h4s: partner opened 1♥ and South has 4-5 spades.
      const M1 = (t, lo, hi, calls, h4s) => PO({ calls, setup: r => {
        const M = h4s ? 2 : anyMajor(r);
        const o = { [M]: t };
        if (h4s) o[3] = [4, 5];
        return { south: { lens: rl(r, sp(o, [0, 6])), hcp: [lo, hi] }, north: { lens: sp({ [M]: [5, 6] }, [0, 5]), hcp: [11, 19], opens: B(1, M) }, note: `Partner opened 1${SY[M]} (5+ cards).` };
      } });
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
        want(M1([0, 6], 0, 5, 1), 'B.pass'),                    // too weak to respond
        want(M1([0, 2], 6, 9, 1), 'B.1nt'),                     // 1NT response
        want(M1([3, 3], 13, 16, 2), 'B.support-after-new-suit', 80),   // new suit, then support
        want(M1([2, 2], 9, 13, 2, true), 'D.after-major-rebid', 80),   // opener rebids six: Hx is support
      ];
    })(),
  },
  {
    id: 'minor-resp', name: 'Responding to 1♣/1♦', refs: 'C · D',
    blurb: 'Your first response, then your second call after opener rebids.',
    recipes: (() => {
      // South gets lengths lf(rng) and lo..hi HCP. pp: partner is balanced 18-19 (so opener rebids 2NT).
      const m1 = (lf, lo, hi, calls, pp) => PO({ calls, setup: r => {
        const m = ri(r, 0, 1);
        const north = pp ? { lens: 'bal', hcp: [18, 19] } : { lens: sp({}, [0, 6]), hcp: [11, 19] };
        return { south: { lens: lf(r), hcp: [lo, hi] }, north: { ...north, opens: B(1, m) }, note: `Partner opened 1${SY[m]}.` };
      } });
      return [
        m1(nmaj, 6, 10, 2, true),
        m1(nmaj, 6, 10, 2, true),
        m1(balL, 6, 12, 2),
        m1(balL, 6, 12, 2),
        m1(r => rl(r, sp({ 2: [4, 5], 3: [0, 4] }, [0, 5])), 6, 15, 2),   // hearts
        m1(r => rl(r, sp({ 3: [4, 5], 2: [0, 4] }, [0, 5])), 6, 15, 2),   // spades
        m1(r => rl(r, sp({}, [0, 6])), 6, 14, 2),
        m1(r => rl(r, sp({}, [0, 6])), 6, 14, 2),
        m1(nmaj, 11, 12, 1),          // 2NT
        m1(nmaj, 13, 15, 1),          // 3NT
        want(m1(r => rl(r, sp({}, [0, 6])), 0, 5, 1), 'C.pass'),   // too weak to respond
        want(m1(r => rl(r, sp({ [ri(r, 2, 3)]: [4, 4] }, [1, 4])), 6, 12, 2, true), 'D.after-2nt'),   // 1m – 1M – 2NT (18-19): game or pass
        // Opener reverses (15-19) or jump-shifts (20-22) into hearts after your 1♠.
        ...[[15, 19, 'D.after-reverse'], [20, 22, 'D.after-jump-shift']].map(([lo, hi, id]) => want(PO({ setup: r => {
          const m = ri(r, 0, 1);
          return { south: { lens: rl(r, sp({ 3: [4, 5], 2: [0, 3] }, [1, 5])), hcp: [6, 12] }, north: { lens: sp({ [m]: [5, 6], 2: [4, 4], 3: [0, 2] }, [0, 3]), hcp: [lo, hi], opens: B(1, m) }, note: `Partner opened 1${SY[m]}.` };
        } }), id, 30)),
      ];
    })(),
  },
  {
    id: 'comp', name: 'Competitive bidding', refs: 'F',
    blurb: "Overcalls, takeout and negative doubles, the cue bid after partner's double, Michaels, Cappelletti.",
    recipes: (() => {
      // Overcall: RHO opens 1x.
      const OV = (lf, lo, hi) => rng => {
        const x = ri(rng, 0, 3);
        return oneCall('E', [B(1, x)], deal(rng, lf(rng, x), lo, hi), `RHO opened 1${SY[x]}.`);
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
        return oneCall('N', [B(1, o), B(1, v)], h, `Partner opened 1${SY[o]}; RHO overcalled 1${SY[v]}.`);
      };
      // Advancing a takeout double: LHO opens 1x, partner doubles, RHO passes.
      const ADV = rng => {
        const x = ri(rng, 0, 3);
        return oneCall('W', [B(1, x), 'X', 'P'], deal(rng, rl(rng, sp({ [x]: [0, 3] }, [0, 6])), 0, 14), `LHO opened 1${SY[x]}; partner made a takeout double.`);
      };
      // Cappelletti: RHO opens 1NT.
      const CAP = (lf, lo, hi) => rng => oneCall('E', ['1N'], deal(rng, lf(rng), lo, hi), 'RHO opened a strong 1NT. You play Cappelletti.');
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
        // Weak with a long fit for partner's minor: pre-emptive jump raise.
        rng => {
          const o = ri(rng, 0, 1), v = pick(rng, [2, 3]);
          const h = deal(rng, rl(rng, sp({ [o]: [5, 6], [v === 2 ? 3 : 2]: [0, 3] }, [0, 4])), 4, 8);
          return oneCall('N', [B(1, o), B(1, v)], h, `Partner opened 1${SY[o]}; RHO overcalled 1${SY[v]}.`);
        },
        // Partner's weak jump overcall: raise to the level of the fit.
        rng => {
          const x = ri(rng, 0, 3), y = pick(rng, [0, 1, 2, 3].filter(t => t !== x)), ov = B(y > x ? 2 : 3, y);
          const h = deal(rng, rl(rng, sp({ [y]: [ri(rng, 1, 4), 4] }, [0, 5])), 3, 12);
          return oneCall('W', [B(1, x), ov, 'P'], h, `LHO opened 1${SY[x]}; partner made a weak jump overcall, ${plain(ov)}.`);
        },
        ADV,
        ADV,
        CAP(r => rl(r, sp({ 2: [4, 5], 3: [4, 5] }, [0, 4])), 8, 14),
        CAP(r => { const M = ri(r, 2, 3), m = ri(r, 0, 1); return rl(r, sp({ [M]: [5, 6], [5 - M]: [0, 3], [m]: [4, 5] }, [0, 4])); }, 8, 14),
        CAP(r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [6, 7] }, [0, 3])); }, 8, 13),
        CAP(r => balL(r), 8, 18),
        CAP(r => rl(r, sp({ 0: [5, 6], 1: [5, 6] }, [0, 3])), 8, 13),
      ];
    })(),
  },
  {
    id: 'slam', name: 'Slam bidding', refs: 'B · G', slam: true,
    blurb: 'Jacoby 2NT to RKCB from both sides, key-card decisions, kings and grand slams, quantitative 4NT.',
    recipes: (() => {
      // JR: partner opens 1M, South bids Jacoby 2NT with lo..hi.
      const JR = (lo, hi) => PO({ setup: r => {
        const M = anyMajor(r);
        return { south: { lens: rl(r, sp({ [M]: [4, 5] }, [1, 5])), hcp: [lo, hi] }, north: { lens: sp({ [M]: [5, 6] }, [1, 5]), hcp: [11, 21], opens: B(1, M) }, note: `Partner opened 1${SY[M]}.` };
      } });
      // JO: South opens 1M and partner bids Jacoby 2NT.
      const fiveMajor = r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [2, 4])); };
      const jacobyPartner = (r, h) => { const M = ST.indexOf(openingBid(h).bid[1]); return sp({ [M]: [4, 5] }, [1, 5]); };
      const JO = SO({ south: { lens: fiveMajor, hcp: [12, 21], ok: opensAs(/^1[HS]$/) }, north: { lens: jacobyPartner, hcp: [13, 22] }, calls: 3 });
      const JO2 = SO({ south: { lens: fiveMajor, hcp: [11, 21], ok: opensAs(/^1[HS]$/) }, north: { lens: jacobyPartner, hcp: [13, 22] } });
      // SR: South opens 1M with 18-22 and partner raises. SRP: the other way round.
      const SR = SO({ south: { lens: r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [0, 4])); }, hcp: [18, 22], ok: opensAs(/^1[HS]$/) },
        north: { lens: (r, h) => { const M = L(h)[3] >= 5 ? 3 : 2; return sp({ [M]: [3, 4] }, [1, 5]); }, hcp: [6, 12] } });
      const SRP = PO({ setup: r => { const M = anyMajor(r); return { south: { lens: rl(r, sp({ [M]: [3, 4] }, [1, 5])), hcp: [6, 12] }, north: { lens: sp({ [M]: [5, 6] }, [0, 4]), hcp: [18, 22], opens: B(1, M) }, note: `Partner opened 1${SY[M]}.` }; } });
      return [
        JR(13, 22), JR(16, 22), JR(18, 22), JR(20, 22),
        JO, JO, JO2, SR, SR, SRP,
        // 2♣ – positive response: 23 + 8 = 31+, so these are slam auctions.
        want(SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [23, 25] }, north: { hcp: [8, 11] } }), 'GUIDE.2c-positive-rebid', 60),
        want(PO({ setup: r => { const s = ri(r, 0, 3); return { south: { lens: rl(r, sp({}, [1, 5])), hcp: [8, 11] }, north: { lens: sp({ [s]: [5, 6] }, [0, 4]), hcp: [23, 25], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }; } }), 'GUIDE.2c-positive-continue', 60),
        want(PO({ setup: r => ({ south: { lens: nmaj(r), hcp: [8, 12] }, north: { lens: 'bal', hcp: [23, 24], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }), calls: 1 }), 'E.2c-positive-nt'),
        want(PO({ setup: r => { const s = ri(r, 0, 3); return { south: { lens: rl(r, sp({ [s]: [5, 6] }, [0, 4])), hcp: [8, 12] }, north: { lens: 'bal', hcp: [23, 24], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }; }, calls: 1 }), 'E.2c-positive-suit'),
        want(JR(16, 22), 'G.slam-game', 80),                                      // 31+ but only 0-1 key cards: bid game
        want(SO({ south: { lens: r => { const M = anyMajor(r), s = pick(r, [0, 1, 2, 3].filter(t => t !== M && !(M === 2 && t === 3))); return rl(r, sp({ [M]: [5, 5], [s]: [5, 5] }, [0, 3])); }, hcp: [12, 17], ok: opensAs(/^1[HS]$/) },
          north: { lens: (r, h) => { const M = ST.indexOf(openingBid(h).bid[1]); return sp({ [M]: [4, 5] }, [1, 5]); }, hcp: [13, 16] } }), 'B.jacoby-side-suit', 60),   // opener shows a good side suit
        PO({ setup: r => ({ ...NT1, south: { lens: nmaj(r), hcp: [16, 17] } }), calls: 1 }),                     // quantitative 4NT
        SO({ south: { lens: balL, hcp: [15, 17] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [16, 17] } }),   // answer 4NT
      ];
    })(),
  },
  {
    id: 'big', name: 'Strong openings & weak twos', refs: 'E',
    blurb: '2NT and 2♣ auctions from both sides, and the weak-two 2NT ask.',
    recipes: (() => {
      const NT2 = { north: { lens: 'bal', hcp: [20, 22], opens: '2N' }, note: 'Partner opened 2NT (20-22).' };
      const twoClubs = PO({ setup: r => ({ south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 7] }, north: { lens: 'bal', hcp: [23, 24], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }) });
      return [
        PO({ setup: r => ({ ...NT2, south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 10] } }) }),
        PO({ setup: r => { const M = anyMajor(r); return { ...NT2, south: { lens: rl(r, sp({ [M]: [5, 6], [5 - M]: [0, 3] }, [0, 4])), hcp: [0, 10] } }; } }),
        twoClubs, twoClubs,
        // Unbalanced 2♣ openings: partner or you with a 5+ suit, then 2♦ and a suit rebid.
        PO({ setup: r => { const s = ri(r, 0, 3); return { south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 7] }, north: { lens: sp({ [s]: [5, 7] }, [0, 4]), hcp: [23, 26], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }; } }),
        PO({ setup: r => { const s = ri(r, 2, 3); return { south: { lens: rl(r, sp({ [s]: [2, 4] }, [0, 6])), hcp: [0, 7] }, north: { lens: sp({ [s]: [5, 7] }, [0, 4]), hcp: [23, 26], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }; } }),
        SO({ south: { lens: r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [5, 7] }, [0, 4])); }, hcp: [23, 26], ok: h => !isBal(h) }, north: { hcp: [0, 7] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [23, 27] }, north: { hcp: [0, 7] } }),
        SO({ south: { lens: balL, hcp: [23, 26] }, north: { hcp: [0, 7] } }),
        weakTwo, weakTwo,
        SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } }),
        // The simple answers to 2NT.
        want(PO({ setup: r => ({ ...NT2, south: { lens: nmaj(r), hcp: [0, 3] } }), calls: 1 }), 'E.2nt-pass'),
        want(PO({ setup: r => ({ ...NT2, south: { lens: nmaj(r), hcp: [4, 10] } }), calls: 1 }), 'E.2nt-game'),
        want(PO({ setup: r => { const M = anyMajor(r); return { ...NT2, south: { lens: rl(r, sp({ [M]: [5, 6], [5 - M]: [0, 3] }, [0, 4])), hcp: [0, 5] } }; } }), 'E.2nt-transfer-continue', 40),
        // Partner opens a weak two: pass, raise, or ask with 2NT (and decide after the answer).
        ...['E.weak-two-pass', 'E.weak-two-raise', 'E.weak-two-ask', 'GUIDE.weak-two-after-ask'].map(id => want(PO({ calls: 1, setup: r => { const M = anyMajor(r); return { south: { lens: rl(r, sp({ [M]: id === 'E.weak-two-raise' ? [3, 4] : [0, 4] }, [0, 6])), hcp: id === 'E.weak-two-pass' ? [0, 13] : id === 'E.weak-two-raise' ? [4, 13] : [14, 18] }, north: { lens: sp({ [M]: [6, 6] }, [0, 4]), hcp: [5, 10], opens: B(2, M) }, note: `Partner opened a weak 2${SY[M]}.` }; } }), id, 60)),
        // Partner pre-empts: pass, or raise to game with 3+ aces and kings.
        ...['E.preempt-pass', 'E.preempt-raise'].map(id => want(PO({ calls: 1, setup: r => { const s = ri(r, 0, 3); return { south: { lens: rl(r, sp({ [s]: [1, 3] }, [1, 5])), hcp: id === 'E.preempt-raise' ? [12, 18] : [6, 14] }, north: { lens: sp({ [s]: [7, 7] }, [0, 3]), hcp: [4, 10], opens: B(3, s) }, note: 'Partner opened with a pre-empt.' }; } }), id, 60)),
      ];
    })(),
  },
];

// ---------- Losing Trick Count ----------
// Partner's shown losers, from the chart's LTC table (the minimum of the range shown).
const RAISE_LOSERS = {
  '2': [9, 'a simple raise (6-9)'], '3D': [9, 'a 3♦ raise (4+ trumps, 7-9)'],
  '3C': [8, 'a 3♣ raise (4+ trumps, 10-12)'], '3': [8, 'a limit raise (10-12)'],
};
const numOpts = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
// Two counting steps, answered on a number pad: your losers, then the tricks LTC predicts.
function ltcSteps(h, calls, pl, label, note) {
  const k = losers(h), t = 24 - (k + pl);
  if (t < 6 || t > 13) return null;
  return [
    { kind: 'num', opts: numOpts(0, 12), calls, note: `${note} Count the losers in your hand.`,
      ans: { bid: String(k), why: `${loserBreak(h)} = ${k} losers. In each suit, count the missing A, K and Q among your top three cards (top two in a doubleton, top one in a singleton).`, ref: 'LTC' } },
    { kind: 'num', opts: numOpts(6, 13), calls, note: `You have ${k} losers. Partner showed ${label}, which counts as ${pl} losers. How many tricks does LTC predict?`,
      ans: { bid: String(t), why: `24 − (${k} + ${pl}) = ${t} tricks: ${t >= 12 ? 'slam territory' : t >= 10 ? 'game in a major' : t === 9 ? 'the 3-level' : `only the ${Math.max(t - 6, 1)}-level`}.`, ref: 'LTC' } },
  ];
}
// You open 1M and partner raises (kind '2', '3D', '3C', or '3' for the limit raise).
// After a limit raise with 13-14 the chart says use LTC, so you also make the call.
const LTO = (kind, lo, hi) => rng => {
  const M = ri(rng, 2, 3), h = deal(rng, rl(rng, sp({ [M]: [5, 6] }, [0, 5])), lo, hi);
  if (!h) return null;
  const ob = openingBid(h);
  if (!ob || ob.bid !== B(1, M)) return null;
  const ps = { '2': [[3, 3], 6, 9], '3D': [[4, 5], 7, 9], '3C': [[4, 5], 10, 12], '3': [[3, 3], 10, 12] }[kind];
  const n = dealOther(rng, h, sp({ [M]: ps[0] }, [0, 6]), ps[1], ps[2]);
  if (!n) return null;
  const want = kind === '3D' || kind === '3C' ? kind : B(+kind, M);
  const sim = simulate(h, n, 'S', 'You are dealer.');
  if (!sim.contract || sim.calls[2] !== want) return null;
  const [pl, label] = RAISE_LOSERS[kind];
  const st = ltcSteps(h, sim.calls.slice(0, 4), pl, label, `You opened 1${SY[M]}; partner bid ${plain(want)}.`);
  if (!st) return null;
  const d = sim.steps[1];
  if (d && d.ans.ref === 'LTC') st.push({ ...d, note: 'Now make your call.' });
  return { dealer: 'S', hand: h, partner: n, steps: st, calls: sim.calls, pn: sim.pn, contract: sim.contract, ltc: true };
};
// Partner opens 1M and you have a fit: count with partner's opening as 7 losers.
const LTR = (t, lo, hi) => rng => {
  const M = ri(rng, 2, 3), h = deal(rng, rl(rng, sp({ [M]: t }, [0, 5])), lo, hi);
  if (!h) return null;
  const n = dealOther(rng, h, sp({ [M]: [5, 6] }, [0, 5]), 11, 19, opensAs(B(1, M)));
  if (!n) return null;
  const sim = simulate(h, n, 'N', '');
  if (!sim.contract) return null;
  const st = ltcSteps(h, sim.calls.slice(0, 2), 7, 'a 1-level opening (count it as 7 until you learn more)', `Partner opened 1${SY[M]} and you have ${L(h)[M]}-card support.`);
  if (!st) return null;
  return { dealer: 'N', hand: h, partner: n, steps: st, calls: sim.calls, pn: sim.pn, contract: sim.contract, ltc: true };
};
SETS.push({
  id: 'ltc', name: 'Losing Trick Count', refs: 'LTC · B',
  blurb: 'Count your losers and the tricks LTC predicts. With 13-14 after a limit raise, the chart says use LTC to decide: pass or game.',
  recipes: [LTO('3', 13, 14), LTO('3', 13, 14), LTO('3', 13, 14), LTO('3', 13, 14), LTO('2', 11, 18), LTO('3D', 11, 16), LTO('3C', 11, 16), LTR([3, 3], 5, 12), LTR([4, 5], 4, 12)],
});

// ---------- Mixed ----------
// Ten hands, each from a different drill (every drill except LTC). Each new deal moves on to the
// drills the last deal left out, so a few deals in a row cover them all. See buildMixed.
const MIXED = {
  id: 'mixed', name: 'Mixed auctions', refs: 'All', last: true, slam: true, helvic: true, mixed: true,
  blurb: 'Ten hands, each from a different drill, shuffled together. Each new deal moves on to the drills the last one left out.',
  get sources() { return SETS.filter(d => d !== MIXED && d.id !== 'ltc'); },
  get recipes() { return this.sources.map(d => (rng, opts) => pick(rng, d.recipes)(rng, opts)); },
};
SETS.push(MIXED);

// ---------- Building a set ----------
const SET_SIZE = 15;        // hands in every drill; a set can override it with def.size
const setSize = def => (def && def.size) || SET_SIZE;
const POOL = 100;          // hands dealt before picking the set (at least 4x the set size) with the most variety
const MAX_TRIES = 20000;   // recipe attempts per set, at most
// A recipe that fails this many times in a row is skipped for this turn, so one broken recipe
// cannot stall the whole set. Working recipes succeed at least one time in ten.
const MAX_MISSES = 300;

// Non-slam drills skip slam hands (31+ between you, a 4NT ask, or a slam contract),
// so they stay about game decisions. Slam is practised in the slam drill.
// (31+ only counts when the auction reaches a contract: a 2♣ positive response, where the drill
// stops after your answer, isn't a slam auction.)
const slamHand = q => !!q.partner && q.ours !== false && (q.calls.includes('4N') || /^[67]/.test(q.contract || '') || (!!q.contract && hcp(q.hand) + hcp(q.partner) >= 31));

// The situations a hand practises; the set is chosen to cover as many as possible.
function features(q) {
  const f = new Set(), bids = c => c.filter(x => x !== 'P');
  f.add('rec:' + q.rec);
  f.add('ctx:' + bids(q.steps[0].calls).join(' '));
  q.steps.forEach((s, k) => {
    f.add('call' + k + ':' + s.ans.bid);
    f.add('call:' + s.ans.bid);
    f.add('path:' + q.steps.slice(0, k + 1).map(x => x.ans.bid).join('-'));
  });
  (q.pn || []).filter(x => !x.auto).forEach(x => f.add('pcall:' + x.call));
  (q.on || []).forEach(x => f.add('opp:' + x.call));
  f.add('len:' + q.steps.length);
  if (q.contract) f.add('res:' + (/^[67]/.test(q.contract) ? 'slam' : /^(4[HS]|5[CD]|3N)$/.test(q.contract) ? 'game' : q.ours === false ? 'theirs' : 'part') + (q.cdbl || ''));
  return f;
}
const weight = k => k.startsWith('rec:') ? 4 : /^(call|pcall|res):/.test(k) ? 3 : /^(path|ctx):/.test(k) ? 2 : 1;

// Deal the questions for one set. The same (set, seed, opts) always gives the same hands, on
// any device: everything depends on the seeded random numbers, nothing on timing.
// opts.helvic: our side plays Helvic Wriggle when 1NT is doubled.
function buildSet(def, seed, opts) {
  opts = opts || {};
  if (def.mixed) return buildMixed(def, seed, opts);
  let hsh = 0;
  for (const c of def.id) hsh = (hsh * 31 + c.charCodeAt(0)) | 0;
  const rng = mulberry(seed * 7919 + hsh), recipes = def.recipes;
  const size = setSize(def), poolSize = Math.max(POOL, size * 4);
  const pool = [], seen = new Set();
  let i = 0, g = 0, misses = 0;
  const order = shuffle(rng, recipes.map((_, k) => k));
  while (pool.length < poolSize && g < MAX_TRIES) {
    g++;
    const rec = order[i % order.length], q = recipes[rec](rng, opts);
    if (q && q.steps && q.steps.length && (def.slam || !slamHand(q))) {
      const key = q.hand.map(s => s.join('.')).join('|') + q.steps[0].calls.join();
      if (!seen.has(key)) { seen.add(key); q.rec = rec; pool.push(q); i++; misses = 0; continue; }
    }
    if (++misses >= MAX_MISSES) { i++; misses = 0; }
  }
  if (pool.length <= size) return shuffle(rng, pool);
  // Each deal focuses on the next `size` kinds of hand (recipes) in a fixed rotation, so a drill
  // with more kinds than hands covers them all over a few deals instead of always favouring the
  // longest auctions.
  const uniq = [...new Set(recipes)], ui = r => uniq.indexOf(recipes[r]);
  const rot = shuffle(mulberry(4242 + hsh), uniq.map((_, u) => u)), st = ((Math.max(1, seed) - 1) * size) % uniq.length;
  const focus = new Set(Array.from({ length: Math.min(size, uniq.length) }, (_, j) => rot[(st + j) % uniq.length]));
  const usedU = new Set();
  // Greedy: repeatedly take the hand that adds the most situations not yet covered.
  const cands = pool.map(q => ({ q, f: features(q) })), got = new Set(), out = [];
  while (out.length < size) {
    let best = -1, bi = 0;
    cands.forEach((c, k) => {
      let sc = rng() * 0.5;
      for (const x of c.f) if (!got.has(x)) sc += weight(x);
      const u = ui(c.q.rec);
      if (focus.has(u) && !usedU.has(u)) sc += 40;
      if (sc > best) { best = sc; bi = k; }
    });
    const c = cands.splice(bi, 1)[0];
    usedU.add(ui(c.q.rec));
    out.push(c.q);
    c.f.forEach(x => got.add(x));
  }
  return shuffle(rng, out);
}

// Mixed: one hand from each of `size` different drills. The drills come in a fixed shuffled
// order and seed n starts where seed n-1 stopped, so consecutive deals cover different drills
// (14 drills: seed 1 has drills 1-10, seed 2 has 11-14 and 1-6, and so on). Within a drill, the
// hand chosen is the one that adds the most situations (recipes, calls, auctions) not yet in the set.
const MIX_CANDS = 12;       // hands dealt per drill before choosing one
function buildMixed(def, seed, opts) {
  const src = def.sources, size = setSize(def);
  const order = shuffle(mulberry(20261026), src.map((_, k) => k));
  const start = ((Math.max(1, seed) - 1) * size) % order.length;
  const rng = mulberry(seed * 7919 + 4242), got = new Set(), out = [];
  for (let k = 0; k < Math.min(size, order.length * 4); k++) {
    const di = order[(start + k) % order.length], d = src[di];
    // Each time a drill comes round in Mixed, it moves on to its next kind of hand (recipe),
    // so rarer topics (Cappelletti, Michaels...) take their turn too.
    const uniq = [...new Set(d.recipes)], app = Math.floor(((Math.max(1, seed) - 1) * size + k) / order.length);
    const target = d.recipes.indexOf(uniq[shuffle(mulberry(9001 + di), uniq.map((_, u) => u))[app % uniq.length]]);
    const recs = shuffle(rng, d.recipes.map((_, r) => r)), cands = [];
    let tries = 0, i = 0;
    while (cands.length < MIX_CANDS && tries < 600) {
      tries++;
      const q = d.recipes[target](rng, opts);
      if (q && q.steps && q.steps.length && (d.slam || !slamHand(q))) { q.rec = d.id + ':' + target; q.src = d.id; cands.push(q); }
    }
    tries = 0;
    while (!cands.length && tries < 3000) {
      tries++;
      const r = recs[i % recs.length], q = d.recipes[r](rng, opts);
      if (q && q.steps && q.steps.length && (d.slam || !slamHand(q))) { q.rec = d.id + ':' + r; q.src = d.id; cands.push(q); i++; }
      else if (tries % 300 === 0) i++;
    }
    if (!cands.length) continue;
    // From the slam drill, two deals in three take a small slam (the greedy pick otherwise
    // favours grand slams, whose auctions have more distinct calls).
    let pool = cands;
    if (d.id === 'slam') {
      const want = seed % 3 === 0 ? /^7/ : /^6/, w = cands.filter(q => want.test(q.contract || ''));
      if (w.length) pool = w;
    }
    let best = -1, pickQ = pool[0];
    for (const q of pool) {
      let sc = rng() * 0.5;
      for (const x of features(q)) if (!got.has(x)) sc += weight(x);
      if (sc > best) { best = sc; pickQ = q; }
    }
    features(pickQ).forEach(x => got.add(x));
    out.push(pickQ);
    if (out.length >= size) break;
  }
  return shuffle(rng, out);
}

