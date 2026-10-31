// Four-hand drills: all four hands are dealt and the opponents bid, following the simple
// scripts below. Each recipe deals the hands, then describes the auction with a function
// F(seat, calls, hand, n) that returns each call: our side by the rules in competitive.js,
// the opponents by script. sim4() (auction.js) plays it out.
//
// Recipes take (rng, opts). opts.helvic: our side plays Helvic Wriggle when 1NT is doubled.
'use strict';

// An opponent's scripted call, with the reason shown under "Opponents' calls".
const OC = (bid, why) => ({ bid, why });
const opens1NT = h => { const o = openingBid(h); return isCall(o) && o.bid === '1N'; };
// Opponent doubled at 1NT runs to a 5-card suit with 0-7 HCP; otherwise passes.
function oppRun(h, calls, why) {
  const s = longest(h);
  if (hcp(h) <= 7 && h[s].length >= 5) return OC(B(cheapIn(s, calls), s), why || `Runs to its ${h[s].length}-card suit.`);
  return AP('');
}

// ---------- Penalty doubles ----------
// Partner opens; RHO overcalls 1NT; you double with 8+.
const PEN_NT = rng => {
  const x = ri(rng, 0, 3), N = deal(rng, rl(rng, sp({ [x]: [4, 6] }, [1, 5])), 11, 14);
  if (!N) return null;
  const ob = openingBid(N);
  if (!ob || ob.bid !== B(1, x)) return null;
  const strong = rng() < .7, S = dealOther(rng, N, strong ? sp({}, [1, 5]) : 'bal', strong ? 8 : 2, strong ? 12 : 7);
  if (!S) return null;
  const E = dealOther(rng, merge(N, S), 'bal', 15, 18, h => stop(h, x));
  if (!E) return null;
  const H = { N, E, S, W: restHand(N, S, E) };
  const F = (seat, c, h, n) => {
    if (n === 0) return ob;
    if (n === 1) return OC('1N', '1NT overcall: 15-18 balanced with a stopper.');
    if (n === 2) return dblNTOvercall(h);
    if (n === 3) return c[2] === 'X' ? oppRun(h, c, 'Runs from 1NT doubled with a weak hand and a 5-card suit.') : AP('');
    return penaltyFollow(seat, c, h, 'N');
  };
  return sim4(H, 'N', F, `Partner opened ${plain(ob.bid)}; RHO overcalled 1NT (15-18).`);
};
// Partner opens 1M; RHO jumps to the 4-level; you double with 8+.
const PEN4 = rng => {
  const M = ri(rng, 2, 3), N = deal(rng, rl(rng, sp({ [M]: [5, 6] }, [0, 5])), 11, 16);
  if (!N) return null;
  const ob = openingBid(N);
  if (!ob || ob.bid !== B(1, M)) return null;
  const strong = rng() < .7, S = dealOther(rng, N, sp({ [M]: [0, 2] }, [1, 6]), strong ? 8 : 0, strong ? 14 : 6);
  if (!S) return null;
  const s = pick(rng, [0, 1, 2, 3].filter(t => t !== M));
  const E = dealOther(rng, merge(N, S), sp({ [s]: [7, 8] }, [0, 3]), 5, 10);
  if (!E) return null;
  const H = { N, E, S, W: restHand(N, S, E) };
  const F = (seat, c, h, n) => {
    if (n === 0) return ob;
    if (n === 1) return OC(B(4, s), `Pre-emptive jump to the 4-level with ${h[s].length} ${SN[s]}.`);
    if (n === 2) return dbl4Level(h, c[1]);
    return penaltyFollow(seat, c, h, 'N');
  };
  return sim4(H, 'N', F, `Partner opened ${plain(ob.bid)}; RHO overcalled at the 4-level.`);
};
// Trap pass: you hold a stack in their suit; partner reopens; you leave the double in.
const TRAP_R = rng => {
  const x = ri(rng, 0, 3), y = pick(rng, [0, 1, 2, 3].filter(t => t !== x));
  const N = deal(rng, rl(rng, sp({ [x]: [4, 5], [y]: [0, 2] }, [1, 4])), 11, 14);
  if (!N) return null;
  const ob = openingBid(N);
  if (!ob || ob.bid !== B(1, x)) return null;
  const S = dealOther(rng, N, sp({ [y]: [4, 6] }, [0, 5]), 8, 13, h => stack(h, y));
  if (!S) return null;
  const E = dealOther(rng, merge(N, S), sp({ [y]: [5, 6] }, [0, 5]), 8, 15);
  if (!E) return null;
  const H = { N, E, S, W: restHand(N, S, E) }, lv = y > x ? 1 : 2;
  const F = (seat, c, h, n) => {
    if (n === 0) return ob;
    if (n === 1) return OC(B(lv, y), `Natural overcall: 5+ ${SN[y]}.`);
    if (n === 2) return R('P', `You hold a trump stack in their suit (${h[y].map(r => RANK[r] || r).join('')}). Pass and let partner reopen with a double, then leave it in.`, 'F.trap-pass');
    if (n === 4) return reopen(h, x, y, c, 'The overcall came back to partner. ');
    if (n === 6 && c[4] === 'X') return R('P', `Partner reopened with a double: leave it in. That's the payoff for your trap pass.`, 'F.penalty-leave-in');
    return penaltyFollow(seat, c, h, 'N');
  };
  return sim4(H, 'N', F, `Partner opened ${plain(ob.bid)}; RHO overcalled.`);
};
// You open; LHO overcalls; partner trap-passes; you decide whether to reopen.
const TRAP_O = rng => {
  const x = ri(rng, 0, 3), y = pick(rng, [0, 1, 2, 3].filter(t => t !== x)), short = rng() < .7;
  const S = deal(rng, rl(rng, sp({ [x]: [4, 6], [y]: short ? [0, 2] : [3, 3] }, [1, 5])), 11, 15);
  if (!S) return null;
  const ob = openingBid(S);
  if (!ob || ob.bid !== B(1, x)) return null;
  const N = dealOther(rng, S, sp({ [y]: [4, 6] }, [0, 5]), 8, 13, h => stack(h, y));
  if (!N) return null;
  const W = dealOther(rng, merge(N, S), sp({ [y]: [5, 6] }, [0, 5]), 8, 15);
  if (!W) return null;
  const H = { N, S, W, E: restHand(N, S, W) }, lv = y > x ? 1 : 2;
  const F = (seat, c, h, n) => {
    if (n === 0) return ob;
    if (n === 1) return OC(B(lv, y), `Natural overcall: 5+ ${SN[y]}.`);
    if (n === 2) return R('P', `Trap pass: partner holds a stack in ${SN[y]} and waits for your reopening double.`, 'F.trap-pass');
    if (n === 4) return reopen(h, x, y, c, `LHO's ${plain(c[1])} came back to you. `);
    if (n === 6 && c[4] === 'X') return R('P', 'Your reopening double is left in for penalties.', 'F.penalty-leave-in');
    return penaltyFollow(seat, c, h, 'S');
  };
  return sim4(H, 'S', F, 'You are dealer.');
};
// Partner opens; RHO doubles for takeout; you redouble with 10+ and no fit; they run.
const RDBL = rng => {
  const x = ri(rng, 0, 3), N = deal(rng, rl(rng, sp({ [x]: [4, 6] }, [1, 5])), 11, 14);
  if (!N) return null;
  const ob = openingBid(N);
  if (!ob || ob.bid !== B(1, x)) return null;
  const S = dealOther(rng, N, sp({ [x]: [0, 2] }, [1, 5]), 10, 14);
  if (!S) return null;
  const E = dealOther(rng, merge(N, S), sp({ [x]: [0, 2] }, [3, 5]), 12, 15, h => { const o = overcall(h, x); return !!o && o.bid === 'X'; });
  if (!E) return null;
  const H = { N, E, S, W: restHand(N, S, E) };
  const F = (seat, c, h, n) => {
    if (n === 0) return ob;
    if (n === 1) return OC('X', 'Takeout double.');
    if (n === 2) return R('XX', `RHO doubled partner's opening. With ${hcp(h)} HCP (10+) and no fit, redouble: it's penalty-minded.`, 'F.redouble');
    if (n === 3) { const s = longest(h, [x]); return OC(B(cheapIn(s, c), s), 'Runs from the redouble to its longest suit.'); }
    if (n === 8 && /^[12][CDHS]$/.test(c[6])) {
      const t = ST.indexOf(c[6][1]);
      if (L(h)[t] >= 3 && t >= 2) return R(B(+c[6][0] + 1, t), `Partner's redouble showed 10+ and now ${SN[t]}. With ${L(h)[t]} ${SN[t]} raise one level: an invitation (about 21-24 between you).`, 'GUIDE.redouble-raise');
      return AP('');
    }
    if (n === 10 && /^[23][HS]$/.test(c[8]) && c[8][1] === c[6][1]) {
      const t = ST.indexOf(c[8][1]);
      const lg = ltcGame(h, 7, "partner's raise");
      if (hcp(h) < 13 && lg) return R(B(4, t), `Partner raised your ${SN[t]}. You have ${hcp(h)} HCP, but shape counts. ${lg}: 4${SY[t]}.`, 'GUIDE.redouble-raise-answer');
      return hcp(h) >= 13 ? R(B(4, t), `Partner raised your ${SN[t]}. With ${hcp(h)} (13+) you have enough for game: 4${SY[t]}.`, 'GUIDE.redouble-raise-answer')
        : R('P', `Partner raised your ${SN[t]} (11-14 opposite your 10+). With ${hcp(h)}, stop: pass.`, 'GUIDE.redouble-raise-answer');
    }
    return penaltyFollow(seat, c, h, 'N');
  };
  return sim4(H, 'N', F, `Partner opened ${plain(ob.bid)}; RHO made a takeout double.`);
};

// ---------- Doubling their 1NT ----------
// role 'doubler': you double (dealer E); 'advancer': partner doubled (dealer W).
function theirNT(role) {
  return rng => {
    const O = deal(rng, balL(rng), 15, 17);
    if (!O || !opens1NT(O)) return null;
    const D = dealOther(rng, O, 'bal', 16, 19);
    if (!D) return null;
    const run = rng() < .55;
    const R2 = dealOther(rng, merge(O, D), run ? sp({}, [0, 6]) : sp({}, [1, 5]), run ? 0 : 3, run ? 7 : 12, run ? (h => h[longest(h)].length >= 5) : null);
    if (!R2) return null;
    const A = restHand(O, D, R2);
    const H = role === 'doubler' ? { E: O, S: D, W: R2, N: A } : { W: O, N: D, E: R2, S: A };
    const F = (seat, c, h, n) => {
      if (n === 0) return OC('1N', 'Strong 1NT, 15-17.');
      if (n === 1) return vs1NT(h);
      if (n === 2) return oppRun(h, c, 'Runs from 1NT doubled with a weak hand and a 5-card suit.');
      if (n === 3) return ntDblAdvance(h, c);
      if (n === 5) return ntDblNext(h, c);
      if (n === 7) return c[5] === 'X' ? R('P', 'Partner doubled for penalties: leave it in.', 'H.nt-double-next') : AP('');
      return AP('');
    };
    return sim4(H, role === 'doubler' ? 'E' : 'W', F, role === 'doubler' ? 'RHO opened a strong 1NT (15-17).' : 'LHO opened a strong 1NT; partner doubled for penalties (16+).');
  };
}

// ---------- Our 1NT doubled ----------
// role 'resp': partner opens 1NT (dealer N); 'open': you open 1NT (dealer S, Helvic only,
// since by the chart the opener just passes). kind: the type of responding hand to deal.
// chartToo: the opener's side is also dealt when playing the chart system (opener just passes
// partner's redouble or sign-off).
function ourNT(role, kind, chartToo) {
  return (rng, opts) => {
    const helvic = !!(opts && opts.helvic);
    if (role === 'open' && !helvic && !chartToo) return null;
    const spec = {
      values: [sp({}, [1, 5]), helvicValues(), helvicValues() + 3], one: [sp({}, [0, 6]), 0, helvicValues() - 1, h => helvicType(h) === 'one'],
      two: [sp({}, [0, 5]), 0, helvicValues() - 1, h => helvicType(h) === 'two'], wriggle: [sp({}, [1, 4]), 0, helvicValues() - 1, h => helvicType(h) === 'wriggle'],
    }[kind];
    const ac = SYS.acol, nt = ac ? '12-14' : '15-17';
    const O = deal(rng, balL(rng), ac ? 12 : 15, ac ? 14 : 17);
    if (!O || !opens1NT(O)) return null;
    const Rh = dealOther(rng, O, spec[0], spec[1], spec[2], spec[3]);
    if (!Rh) return null;
    const D = dealOther(rng, merge(O, Rh), 'bal', 16, 19);
    if (!D) return null;
    const X = restHand(O, Rh, D);
    const H = role === 'resp' ? { N: O, S: Rh, E: D, W: X } : { S: O, N: Rh, W: D, E: X };
    const F = (seat, c, h, n) => {
      if (n === 0) return role === 'open' ? (ac ? acolOpening(h) : R('1N', '15-17 balanced: open 1NT.', 'A.open-1nt')) : OC('1N', `${nt} balanced.`);
      if (n === 1) return OC('X', 'Penalty double (16+).');
      if (seat === 'E' || seat === 'W') return AP('');
      const ro = (role === 'resp') === (seat === 'S') ? 'r' : 'o';
      return ac && !helvic ? acolNTDoubled(ro, h, c) : ntDoubledCall(ro, h, c, helvic);
    };
    return sim4(H, role === 'resp' ? 'N' : 'S', F, role === 'resp' ? `Partner opened 1NT (${nt}); RHO doubled for penalties.` : 'You are dealer.');
  };
}

// ---------- The cue bid after partner's takeout double ----------
// role 'adv': you advance with 12+ (dealer W); 'dbl': you are the doubler (dealer E).
function cueDeal(role) {
  return rng => {
    const x = ri(rng, 0, 3), O = deal(rng, rl(rng, sp({ [x]: [4, 6] }, [1, 5])), 11, 14);
    if (!O) return null;
    const ob = openingBid(O);
    if (!ob || ob.bid !== B(1, x)) return null;
    const D = dealOther(rng, O, sp({ [x]: [0, 2] }, [3, 5]), 12, 16, h => { const o = overcall(h, x); return !!o && o.bid === 'X'; });
    if (!D) return null;
    const A = dealOther(rng, merge(O, D), sp({ [x]: [0, 4] }, [0, 6]), 12, 15, h => { const a = advance(h, x); return !!a && a.bid === B(2, x); });
    if (!A) return null;
    const P = restHand(O, D, A);
    const H = role === 'adv' ? { W: O, N: D, E: P, S: A } : { E: O, S: D, W: P, N: A };
    const F = (seat, c, h, n) => {
      if (n === 0) return OC(ob.bid, 'Natural opening.');
      if (n === 1) return R('X', `Takeout double: ${hcp(h)} HCP, short in ${SN[x]}, 3+ in every unbid suit.`, 'F.takeout-double');
      if (n === 3) return advance(h, x);
      if (n === 5) return cueAnswer(h, x, c);
      if (n === 7) return cuePlace(h, x, c[5]);
      if (n === 9 && /^3[HS]$/.test(c[7]) && c[7][1] !== c[5][1]) return cueRaise(h, x, c[7]);
      return AP('');
    };
    return sim4(H, role === 'adv' ? 'W' : 'E', F, role === 'adv' ? `LHO opened ${plain(ob.bid)}; partner made a takeout double.` : `RHO opened ${plain(ob.bid)}.`);
  };
}

// ---------- Unassuming cue bid ----------
// role 'adv': partner overcalls, you advance (dealer W); 'ov': you overcall (dealer E).
// adv = {t: support length, lo, hi}: the advancer's hand.
function ucbDeal(role, adv) {
  return rng => {
    const x = ri(rng, 0, 3), O = deal(rng, rl(rng, sp({ [x]: [4, 6] }, [1, 5])), 11, 14);
    if (!O) return null;
    const ob = openingBid(O);
    if (!ob || ob.bid !== B(1, x)) return null;
    const y = pick(rng, [2, 3].filter(t => t !== x));
    const V = dealOther(rng, O, sp({ [y]: [5, 6], [x]: [0, 3] }, [0, 5]), 8, 15, h => { const o = overcall(h, x); return isCall(o) && o.bid[1] === ST[y] && /^[12]/.test(o.bid); });
    if (!V) return null;
    const A = dealOther(rng, merge(O, V), sp({ [y]: adv.t }, [0, 5]), adv.lo, adv.hi);
    if (!A) return null;
    const P = restHand(O, V, A), ov = overcall(V, x);
    const H = role === 'adv' ? { W: O, N: V, E: P, S: A } : { E: O, S: V, W: P, N: A };
    const F = (seat, c, h, n) => {
      if (n === 0) return OC(ob.bid, 'Natural opening.');
      if (n === 1) return ov;
      if (n === 3) return ucbAdvance(h, x, c[1]);
      const cue = /^\d/.test(c[3]) && ST.indexOf(c[3][1]) === x;
      if (n === 5) return cue ? ucbOvercaller(h, c[1], c[3]) : AP('');
      if (n === 7) return cue && /^\d/.test(c[5]) && +c[5][0] < 4 ? ucbAfterMin(h, y, c[5]) : AP('');
      return AP('');
    };
    return sim4(H, role === 'adv' ? 'W' : 'E', F, role === 'adv' ? `LHO opened ${plain(ob.bid)}; partner overcalled.` : `RHO opened ${plain(ob.bid)}.`);
  };
}

// ---------- Support doubles ----------
// role 'open': you open (dealer S); 'resp': you respond (dealer N).
// kind 3: opener has exactly 3-card support; 4: four. oppX: RHO doubles instead of overcalling.
function supDeal(role, kind, oppX) {
  return rng => {
    const x = ri(rng, 0, 2), M = x === 2 ? 3 : ri(rng, Math.max(2, x + 1), 3);
    const others = [0, 1, 2, 3].filter(s => s !== x && s !== M);
    const O = deal(rng, rl(rng, sp({ [x]: [x === 2 ? 5 : 4, 6], [M]: kind === 3 ? [3, 3] : [4, 4] }, [0, 5])), 11, kind === 4 ? 19 : 15);
    if (!O) return null;
    const ob = openingBid(O);
    if (!ob || ob.bid !== B(1, x)) return null;
    const respond = h => x >= 2 ? r1M(h, x) : r1m(h, x);
    const Rh = dealOther(rng, O, sp({ [M]: [4, 5], [x]: [0, 3] }, [0, 5]), 6, 15, h => { const r = respond(h); return !!r && r.bid === B(1, M); });
    if (!Rh) return null;
    let y = -1, E;
    if (oppX) E = dealOther(rng, merge(O, Rh), sp({ [x]: [0, 2], [M]: [0, 3] }, [2, 5]), 12, 16);
    else { y = pick(rng, others); E = dealOther(rng, merge(O, Rh), sp({ [y]: [5, 6] }, [0, 4]), 8, 15); }
    if (!E) return null;
    const W = restHand(O, Rh, E);
    const H = role === 'open' ? { S: O, N: Rh, E, W } : { N: O, S: Rh, W: E, E: W };
    const opp = oppX ? 'X' : B(y > M ? 1 : 2, y);
    const F = (seat, c, h, n) => {
      if (n === 0) return ob;
      if (n === 2) return respond(h);
      if (n === 3) return OC(opp, oppX ? 'Takeout double.' : `Natural overcall: 5+ ${SN[y]}.`);
      if (n === 4) return supCall(h, M, c, opp);
      if (n === 6) {
        if (c[4] === 'X' || c[4] === 'XX') return supResp(h, M, c, opp, c[4]);
        if (/^\d/.test(c[4])) return supAfterRaise(h, M, c[4]);
        return AP('');
      }
      if (n === 8) {
        const s4 = c[4], s6 = c[6];
        if ((s4 === 'X' || s4 === 'XX') && (s6 === '2N' || (s6[1] === ST[M] && +s6[0] === 3))) return supAfterInvite(h, M, s6);
        if (/^\d/.test(s4) && +s4[0] === 2 && s6 === B(3, M) && hcp(h) < 13 && ltcGame(h, 8, "partner's invitation")) return R(B(4, M), `Partner invites with 3${SY[M]}. You have ${hcp(h)} HCP, but shape counts. ${ltcGame(h, 8, "partner's invitation")}: accept.`, 'GUIDE.invite-answer');
        if (/^\d/.test(s4) && +s4[0] === 2 && s6 === B(3, M)) return hcp(h) >= 13 ? R(B(4, M), `Partner invites with 3${SY[M]}. With ${hcp(h)} (13-14), accept.`, 'GUIDE.invite-answer') : R('P', `Partner invites with 3${SY[M]}. With ${hcp(h)} (11-12), pass.`, 'GUIDE.invite-answer');
      }
      return AP('');
    };
    return sim4(H, role === 'open' ? 'S' : 'N', F, role === 'open' ? 'You are dealer.' : `Partner opened ${plain(ob.bid)}.`);
  };
}

// ---------- The sets ----------
SETS.find(d => d.id === 'comp').recipes.push(cueDeal('adv'), cueDeal('adv'), cueDeal('dbl'));
SETS.push(
  {
    id: 'pen', name: 'Penalty doubles', refs: 'F · H',
    blurb: 'Doubling a 1NT overcall or a 4-level jump, the trap pass and reopening double, and redoubling a takeout double.',
    recipes: [PEN_NT, PEN_NT, PEN_NT, PEN4, PEN4, TRAP_R, TRAP_R, TRAP_O, TRAP_O, RDBL, RDBL],
  },
  {
    id: 'their-nt', name: 'Doubling their 1NT', refs: 'F · H',
    blurb: 'Double their strong 1NT for penalties, then bid on: leave it in, take out, or punish their escape.',
    recipes: [theirNT('doubler'), theirNT('doubler'), theirNT('advancer'), theirNT('advancer'), theirNT('advancer')],
  },
  {
    id: 'our-nt', name: 'Our 1NT doubled', refs: 'F · H', helvic: true,
    blurb: 'When they double our 1NT: redouble, sign off or wriggle out.',
    recipes: ['values', 'one', 'two', 'wriggle', 'one', 'two', 'wriggle'].flatMap(k => [ourNT('resp', k), ourNT('open', k)])
      // Opener after partner's redouble or sign-off (chart system only; Helvic has its own answers).
      .concat([0, 1].map(j => { const r = want(ourNT('open', j ? 'one' : 'values', true), 'F.nt-doubled-opener', 60); return (rng, opts) => opts && opts.helvic ? null : r(rng, opts); })),
  },
  {
    id: 'ucb', name: 'Unassuming cue bid', refs: 'H',
    blurb: 'Partner overcalls: raise, jump raise, or cue-bid their suit with support and 10+. Then show a minimum or go to game.',
    recipes: [
      ucbDeal('adv', { t: [3, 4], lo: 10, hi: 12 }), ucbDeal('adv', { t: [3, 4], lo: 10, hi: 12 }),
      ucbDeal('adv', { t: [3, 4], lo: 13, hi: 16 }), ucbDeal('adv', { t: [3, 4], lo: 13, hi: 16 }),
      ucbDeal('adv', { t: [3, 3], lo: 6, hi: 9 }), ucbDeal('adv', { t: [4, 5], lo: 4, hi: 8 }),
      ucbDeal('ov', { t: [3, 4], lo: 10, hi: 14 }), ucbDeal('ov', { t: [3, 4], lo: 10, hi: 14 }), ucbDeal('ov', { t: [3, 4], lo: 10, hi: 14 }),
    ],
  },
  {
    id: 'support', name: 'Support doubles', refs: 'H',
    blurb: 'Partner responds 1♥/1♠ and they overcall: double with exactly 3-card support, raise with 4, then partner places the contract.',
    recipes: [supDeal('open', 3), supDeal('open', 3), supDeal('open', 3, true), supDeal('open', 4), supDeal('open', 4, true),
      supDeal('resp', 3), supDeal('resp', 3), supDeal('resp', 3, true), supDeal('resp', 4)],
  },
);
