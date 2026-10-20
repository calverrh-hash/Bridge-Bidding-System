// The chart: one function per decision. Each takes a hand (plus what it needs to know
// about the auction) and returns R(bid, why, chartLetter), or null.
//
// null means "the chart gives no single clear call here". The drill builder relies on this:
// a hand whose first call is null is never dealt, and an auction stops at the first null.
// So when a rule could fairly be read two ways, return null rather than guess.
//
// Chart letters (shown under each answer): OB opening bids, A responses to 1NT,
// B responses to 1♥/♠, C responses to 1♣/♦, D opener's rebid,
// E 2NT / 2♣ / weak twos / pre-empts, F competitive, G slam tools.
'use strict';

// ---------- Opening bids ----------
function minorOpen(l) { return l[0] > l[1] ? '1C' : l[1] > l[0] ? '1D' : (l[0] >= 4 ? '1D' : '1C'); }
function minorWhy(l) {
  return l[0] > l[1] ? 'Clubs are the longer minor: 1♣.'
    : l[1] > l[0] ? 'Diamonds are the longer minor: 1♦.'
    : l[0] >= 4 ? '4-4 in the minors opens 1♦.' : '3-3 in the minors opens 1♣.';
}
function openingBid(h) {
  const p = hcp(h), l = L(h), bal = isBal(h), fiveM = l[2] >= 5 || l[3] >= 5;
  if (p >= 23) return R('2C', `${p} HCP. 23+ opens 2♣ with any shape. It is game forcing.`, 'E');
  if (bal && !fiveM) {
    if (p <= 11) return R('P', `${p} HCP balanced. A balanced 1♣/1♦ opening shows 12-14, so pass.`, 'OB');
    if (p <= 14) return R(minorOpen(l), `${p} HCP balanced with no 5-card major: open a minor (balanced 12-14). ${minorWhy(l)}`, 'OB');
    if (p <= 17) return R('1N', `${p} HCP balanced: open 1NT (15-17).`, 'A');
    if (p <= 19) return R(minorOpen(l), `${p} HCP balanced: 18-19 opens a minor, planning to rebid 2NT. ${minorWhy(l)}`, 'OB');
    return R('2N', `${p} HCP balanced: open 2NT (20-22).`, 'E');
  }
  if (bal && fiveM) {
    if ((p >= 15 && p <= 17) || p >= 20) return null;   // 1NT/2NT or 1M: chart allows both
    const M = l[3] >= 5 ? 3 : 2;
    if (p <= 10) return R('P', `${p} HCP: a 1-level opening needs 11+, and a 5-card suit is too short for a weak two. Pass.`, 'OB');
    return R(B(1, M), `${p} HCP with five ${SN[M]}: open 1${SY[M]} (5-card major, 11-22).`, 'OB');
  }
  if (p >= 11) {
    if (fiveM) {
      const M = l[3] > l[2] ? 3 : 2;
      return R(B(1, M), `${p} HCP, unbalanced, with a 5+ card major: open 1${SY[M]}. ${l[2] === l[3] ? 'Equal-length majors open 1♥.' : 'Open the longer major.'}`, 'OB');
    }
    if (l[0] >= 5 && l[0] === l[1]) return null;   // 5-5 or 6-6 minors
    return R(minorOpen(l), `${p} HCP, unbalanced, no 5-card major: open a minor. ${minorWhy(l)}`, 'OB');
  }
  // 0-10 HCP: pre-empts and weak twos
  const mx = Math.max(...l), longs = [0, 1, 2, 3].filter(s => l[s] === mx);
  if (mx >= 6 && longs.length > 1) return null;
  if (mx >= 9) return null;
  const s = longs[0];
  if (mx === 8) return R(B(4, s), `${p} HCP with eight ${SN[s]}: pre-empt at the 4-level (8-card suit, 0-10 HCP).`, 'E');
  if (mx === 7) return R(B(3, s), `${p} HCP with seven ${SN[s]}: pre-empt at the 3-level (7-card suit, 0-10 HCP).`, 'E');
  if (mx === 6 && s > 0 && p >= 5) return R(B(2, s), `${p} HCP with six ${SN[s]}: weak two (5-10 HCP, 6-card suit).`, 'E');
  if (mx === 6 && s === 0) return R('P', `${p} HCP is too weak to open 1♣, and 2♣ is the strong opening, so there is no weak two in clubs. Pass.`, 'E');
  if (mx === 6) return R('P', `${p} HCP is below the 5-10 range for a weak two. Pass.`, 'E');
  return R('P', `${p} HCP and no 6-card suit for a weak two: a 1-level opening needs 11+. Pass.`, 'OB');
}

// ---------- A: responses to 1NT ----------
function r1NT(h) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (H >= 5 && S >= 5) return null;
  if ((H >= 6 || S >= 6) && Math.min(H, S) >= 4) return null;
  if (H >= 6 || S >= 6) {
    const M = S >= 6 ? 3 : 2;
    if (p >= 16) return null;
    if (p >= 10) return R(M === 2 ? '4D' : '4H', `Six+ ${SN[M]} and ${p} HCP: Texas transfer, ${M === 2 ? '4♦ → 4♥' : '4♥ → 4♠'} (6+ major, 10+, to play).`, 'A');
    return R(M === 2 ? '2D' : '2H', `${Num(l[M])} ${SN[M]}, ${p} HCP: transfer with ${M === 2 ? '2♦' : '2♥'}. ${p <= 7 ? 'Then pass the completion.' : `Then 3${SY[M]} invites (6+ cards, 8-9).`}`, 'A');
  }
  if ((H === 5 && S === 4) || (S === 5 && H === 4)) {
    const f = H === 5 ? 2 : 3, o = f === 3 ? 2 : 3;
    return R('2C', `5-4 in the majors: start with 2♣ Stayman. ${p <= 7 ? `Weak (0-7): over 2♦ bid 2${SY[f]} to play; over 2${SY[o]} pass the fit.` : p <= 9 ? 'With 8-9 you invite after opener replies.' : `Game forcing: over 2♦ use Smolen, 3${SY[o]} = five ${SN[f]} + four ${SN[o]}.`}`, 'A');
  }
  if (H === 5 || S === 5) {
    const M = S === 5 ? 3 : 2;
    if (p >= 15) return null;
    return R(M === 2 ? '2D' : '2H', `Five ${SN[M]}: transfer with ${M === 2 ? '2♦' : '2♥'} (5+ major, any strength). ${p <= 7 ? 'Weak: pass the completion.' : p <= 9 ? 'Then 2NT invites (8-9).' : 'Then 3NT (10-14) lets opener choose.'}`, 'A');
  }
  if (H === 4 || S === 4) {
    if (p >= 8) return R('2C', `${p} HCP with a 4-card major: 2♣ Stayman (8+).`, 'A');
    if (l[0] >= 6 || l[1] >= 6) {
      const m = l[0] >= 6 ? 0 : 1;
      return R('2S', `Weak with six ${SN[m]}: 2♠, then 3${SY[m]} to play.`, 'A');
    }
    return R('P', `${p} HCP: Stayman needs 8+. With 0-7, pass 1NT.`, 'A');
  }
  if (p <= 7) {
    if (l[0] >= 6 || l[1] >= 6) {
      const m = l[0] >= 6 ? 0 : 1;
      return R('2S', `Weak (${p}) with six ${SN[m]}: 2♠ (range-ask or weak long minor). Over opener's reply, ${m === 0 ? 'pass 3♣ or bid 3♣ over 2NT' : 'bid 3♦'} to play.`, 'A');
    }
    return R('P', `${p} HCP with no long suit: 0-7 passes 1NT.`, 'A');
  }
  if (Math.min(...l) <= 1) return null;
  if (p === 8) return R('2S', '8 HCP, no 4-card major: 2♠ McKendrick range-ask. Opener shows 15-16 (2NT) or 17 (3♣).', 'A');
  if (p === 9) return R('2N', '9 HCP, no major: 2NT invites. Opener passes with 15, bids 3NT with 16-17.', 'A');
  if (p <= 15) return R('3N', `${p} HCP balanced, no 4-card major: 3NT (10-15).`, 'A');
  if (p <= 17) return R('4N', `${p} HCP balanced: 4NT quantitative (16-17). Opener passes with 15, bids 6NT with 16-17.`, 'A');
  return null;
}
// Opener answers Stayman.
function stayAns(h) {
  const l = L(h);
  if (l[2] >= 4) return R('2H', `Four hearts: 2♥${l[3] >= 4 ? ' (you may also hold four spades)' : ''}.`, 'A');
  if (l[3] >= 4) return R('2S', 'Four spades, at most three hearts: 2♠.', 'A');
  return R('2D', 'No 4-card major: 2♦.', 'A');
}
// Responder's second call after Stayman; rep is opener's answer.
function afterStay(h, rep) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3], f54 = (H === 5 && S === 4) ? 2 : (S === 5 && H === 4) ? 3 : -1;
  if (p > 15) return null;
  if (rep === '2D') {
    if (f54 >= 0) {
      const o = f54 === 3 ? 2 : 3;
      if (p <= 7) return R(B(2, f54), `Weak 5-4 (0-7): 2${SY[f54]} to play.`, 'A');
      if (p <= 9) return R('2N', `8-9 HCP: 2NT invites.`, 'A');
      return R(B(3, o), `Game force with five ${SN[f54]} and four ${SN[o]}: Smolen 3${SY[o]}. Opener bids 4${SY[f54]} with 3+, else 3NT.`, 'A');
    }
    if (p <= 9) return R('2N', `No fit, 8-9 HCP: 2NT invites.`, 'A');
    return R('3N', `No fit, ${p} HCP: 3NT (10+).`, 'A');
  }
  const M = rep === '2H' ? 2 : 3;
  if (l[M] >= 4) {
    if (p <= 7) return R('P', `Weak 5-4 and a ${SN[M]} fit: pass.`, 'A');
    if (p <= 9) return R(B(3, M), `Fit, 8-9 HCP: 3${SY[M]} invites.`, 'A');
    return R(B(4, M), `Fit, ${p} HCP: 4${SY[M]}.`, 'A');
  }
  if (p <= 7) return null;
  if (p <= 9) return R('2N', `No fit, 8-9 HCP: 2NT invites.`, 'A');
  if (M === 2) return R('2S', `Four spades, no heart fit, ${p} HCP: 2♠ is game forcing. Opener bids 4♠ with four, else 3NT.`, 'A');
  return R('3N', `No fit, ${p} HCP: 3NT.`, 'A');
}
// Responder's second call after a transfer to M was completed.
function afterXfer(h, M) {
  const p = hcp(h), t = L(h)[M];
  if (p <= 7) return R('P', `${p} HCP (0-7): pass the completion.`, 'A');
  if (p <= 9) return t >= 6 ? R(B(3, M), `${Num(t)} ${SN[M]}, 8-9 HCP: 3${SY[M]} invites.`, 'A') : R('2N', `Five ${SN[M]}, 8-9 HCP: 2NT invites.`, 'A');
  if (t === 5 && p <= 14) return R('3N', `Five ${SN[M]}, ${p} HCP: 3NT. Opener passes or corrects to 4${SY[M]} with 3+.`, 'A');
  return null;
}
// Opener answers a 2NT or 3M invitation.
function inv(h) {
  const p = hcp(h);
  return p <= 15 ? R('P', `${p} HCP is a minimum (15): pass the invitation.`, 'A') : R('3N', `${p} HCP is a maximum (16-17): accept with 3NT.`, 'A');
}
function inv4(h, M) {
  const p = hcp(h);
  return p <= 15 ? R('P', `${p} HCP is a minimum (15): pass 3${SY[M]}.`, 'A') : R(B(4, M), `${p} HCP is a maximum (16-17): accept with 4${SY[M]}.`, 'A');
}
// Opener answers Smolen; f is responder's 5-card major.
function smolenAns(h, f) {
  const t = L(h)[f];
  return t >= 3 ? R(B(4, f), `Smolen shows five ${SN[f]}. With ${t} ${SN[f]}, bid 4${SY[f]}.`, 'A') : R('3N', `Smolen shows five ${SN[f]}. With only ${t}, bid 3NT.`, 'A');
}
// Opener answers the 2♠ range-ask.
function rangeAns(h) {
  const p = hcp(h);
  return p <= 16 ? R('2N', `Answering the 2♠ range-ask: ${p} HCP, so 2NT (15-16).`, 'A') : R('3C', 'Answering the 2♠ range-ask: 17 HCP, so 3♣ (maximum).', 'A');
}
// Responder after opener answers 2♠: either the 8-count range-ask or the weak long minor.
// An 8-count with a six-card minor used the range-ask, so it is not "weak" here.
function rangeResp(h, rep) {
  const l = L(h), p = hcp(h), wm = p > 7 ? -1 : l[0] >= 6 ? 0 : l[1] >= 6 ? 1 : -1;
  if (wm < 0) {
    if (p !== 8) return null;
    return rep === '2N' ? R('P', 'You have 8 and opener showed 15-16 with 2NT: pass.', 'A') : R('3N', 'You have 8 and opener showed 17 with 3♣: bid 3NT.', 'A');
  }
  if (rep === '2N') return R(B(3, wm), `Weak with long ${SN[wm]}: 3${SY[wm]} to play.`, 'A');
  return wm === 0 ? R('P', 'Weak with long clubs: pass 3♣.', 'A') : R('3D', 'Weak with long diamonds: 3♦ to play.', 'A');
}

// ---------- B: responses to 1♥/1♠ ----------
// Responder's new suit: 1♠ over 1♥ with four spades, else the longest lower suit at the 2-level.
function newSuitM(h, M) {
  const l = L(h);
  if (M === 2 && l[3] >= 4) return '1S';
  const c = M === 2 ? [0, 1] : [0, 1, 2];
  let b = c[0];
  for (const s of c) if (l[s] > l[b]) b = s;
  return B(2, b);
}
function r1M(h, M) {
  const p = hcp(h), l = L(h), t = l[M];
  if (t >= 5 && p <= 6) return R(B(4, M), `${t} trumps and only ${p} HCP: jump to 4${SY[M]}, the weak raise (5+ trumps, to play).`, 'B');
  if (t >= 4) {
    if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B');
    if (p === 6) return null;
    if (p <= 9) return R('3D', `${t}-card support and ${p} HCP: 3♦ shows 4+ trumps, 7-9.`, 'B');
    if (p <= 12) return R('3C', `${t}-card support and ${p} HCP: 3♣ shows 4+ trumps, 10-12.`, 'B');
    return R('2N', `${t}-card support and ${p} HCP: Jacoby 2NT (4+ trumps, 13+, game forcing).`, 'B');
  }
  if (t === 3) {
    if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B');
    if (p <= 9) return R(B(2, M), `3-card support, ${p} HCP: simple raise to 2${SY[M]} (6-9).`, 'B');
    if (p <= 12) return R(B(3, M), `3-card support, ${p} HCP: limit raise to 3${SY[M]} (10-12).`, 'B');
    const n = newSuitM(h, M);
    return R(n, `3-card support with ${p} HCP: bid a new suit first (${plain(n)}, forcing), then support. It leaves room for slam.`, 'B');
  }
  if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B');
  if (M === 2 && l[3] >= 4) return R('1S', `Fewer than 3 hearts and ${l[3]} spades: 1♠ (4+ spades, 6+, forcing).`, 'B');
  if (p <= 8) return R('1N', `Fewer than 3 ${SN[M]} and ${p} HCP: 1NT (6-10, any shape, not forcing).`, 'B');
  if (p <= 10) return null;
  const n = newSuitM(h, M);
  return R(n, `Fewer than 3 ${SN[M]} and ${p} HCP: new suit at the 2-level (9+, forcing). Bid the longest; with equal length, the lower.`, 'B');
}
// Opener answers Jacoby 2NT.
function jac(h, M) {
  const p = hcp(h), l = L(h);
  const short = [0, 1, 2, 3].filter(s => s !== M && l[s] <= 1);
  const g5 = [0, 1, 2, 3].filter(s => s !== M && l[s] >= 5 && [14, 13, 12].filter(r => has(h, s, r)).length >= 2);
  if (short.length > 1 || (short.length && g5.length) || g5.length > 1) return null;
  if (short.length) {
    const s = short[0];
    return R(B(3, s), `${l[s] === 0 ? 'Void' : 'Singleton'} in ${SN[s]}: show it with 3${SY[s]}.`, 'B');
  }
  if (g5.length) {
    const s = g5[0];
    if (M === 2 && s === 3) return null;
    return R(B(4, s), `Good 5-card ${SN[s]} suit: 4${SY[s]}.`, 'B');
  }
  if (p <= 14) return R(B(4, M), `Flat minimum (${p}): 4${SY[M]} shows 11-14 with no shortness.`, 'B');
  if (p <= 17) return R('3N', `Flat ${p}: 3NT shows 15-17 with no shortness.`, 'B');
  return R(B(3, M), `Flat ${p}: 3${SY[M]} shows 18+ with no shortness.`, 'B');
}
// Jacoby responder after opener's flat answer x: settle or ask for key cards.
function jacCont(h, M, x) {
  const p = hcp(h), G = ' (Trainer guide: about 31+ combined points with a fit is enough to ask for key cards.)';
  if (x === B(4, M)) {
    if (p <= 16) return R('P', `Opener's 4${SY[M]} shows a flat 11-14. With ${p} you have at most ${p + 14} combined: pass.`, 'B');
    if (p >= 20) return R('4N', `Opener has 11-14. With ${p} you have at least ${p + 11} combined and a fit: 4NT RKCB.${G}`, 'G');
    return null;
  }
  if (x === '3N') {
    if (p <= 13) return R(B(4, M), `Opener's 3NT shows a flat 15-17. With ${p}, settle for 4${SY[M]}.`, 'B');
    if (p >= 16) return R('4N', `Opener has 15-17. With ${p} you have at least ${p + 15} combined: 4NT RKCB.${G}`, 'G');
    return null;
  }
  if (x === B(3, M)) return R('4N', `Opener's 3${SY[M]} shows a flat 18+. With ${p} you have at least ${p + 18} combined: 4NT RKCB.${G}`, 'G');
  return null;
}

// ---------- C: responses to 1♣/1♦ ----------
function r1m(h, m) {
  const p = hcp(h), l = L(h), bal = isBal(h), maj = l[2] >= 4 || l[3] >= 4;
  if (p <= 5) return R('P', `${p} HCP: a response needs 6+. Pass.`, 'C');
  let pre = '';
  if (bal && !maj) {
    if (p <= 10) return R('1N', `${p} HCP balanced with no 4-card major: 1NT (6-10).`, 'C');
    if (p <= 12) return R('2N', `${p} HCP balanced with no major: 2NT (11-12).`, 'C');
    if (p <= 15) return R('3N', `${p} HCP balanced with no major: 3NT (13-15).`, 'C');
    pre = `With 16+ balanced, bid a new suit first, then 4NT quantitative. `;
  }
  const c = [0, 1, 2, 3].filter(s => s !== m);
  let b = c[0];
  for (const s of c) if (l[s] > l[b]) b = s;
  if (l[m] > l[b]) return null;   // longest suit is opener's minor: no chart call
  const lv = b > m ? 1 : 2;
  if (lv === 2 && p < 9) return null;
  const tie = c.filter(s => l[s] === l[b]).length > 1;
  return R(B(lv, b), `${pre}${pre ? '' : `${p} HCP: `}new suit, longest first${tie ? ' (equal length: bid the lower)' : ''}: ${plain(B(lv, b))}. ${lv === 1 ? '1-level needs 6+' : '2-level needs 9+'}; forcing.`, 'C');
}

// ---------- D: opener's rebid ----------
// o = opener's suit, r = responder's new suit, lvl = the level responder bid it at.
function rebid(h, o, r, lvl) {
  const p = hcp(h), l = L(h), bal = isBal(h), resp = B(lvl, r), bar = B(2, o), others = [0, 1, 2, 3].filter(s => s !== o && s !== r);
  if (bal) {
    if (r >= 2 && l[r] >= 4) return null;
    if (lvl === 1 && others.some(s => s >= 2 && s > r && l[s] >= 4)) return null;
    if (p >= 12 && p <= 14) return R(lvl === 1 ? '1N' : '2N', `Balanced 12-14: rebid ${lvl === 1 ? '1NT' : '2NT (after a 2-level response)'}.`, 'D');
    if (p >= 18 && p <= 19) return R(lvl === 1 ? '2N' : '3N', `Balanced 18-19: rebid ${lvl === 1 ? '2NT' : '3NT (after a 2-level response)'}.`, 'D');
    return null;
  }
  if (p <= 14) {
    if (l[r] >= 4) return R(B(lvl + 1, r), `Unbalanced 11-14 with ${l[r]} ${SN[r]}: simple raise to ${plain(B(lvl + 1, r))}.`, 'D');
    if (l[o] >= 6) return R(B(2, o), `Unbalanced 11-14 with ${NUM[l[o]]} ${SN[o]}: simple rebid of 2${SY[o]}.`, 'D');
    const below = others.filter(s => l[s] >= 4 && bv(B(cheapest(s, resp), s)) <= bv(bar));
    if (below.length > 1) return null;
    if (below.length === 1) {
      const s = below[0], b = B(cheapest(s, resp), s);
      return R(b, `Unbalanced 11-14: show the 4-card ${SN[s]} suit with ${plain(b)}. It sits below the barrier (2${SY[o]}), so it shows no extra strength.`, 'D');
    }
    if (l[o] >= 5) return R(B(2, o), `Unbalanced 11-14 with nothing else to show: simple rebid of your 5-card suit, 2${SY[o]}.`, 'D');
    return null;
  }
  if (lvl !== 1) return null;
  if (p <= 19) {
    if (l[r] >= 4) return R(B(3, r), `Unbalanced 15-19 with ${l[r]} ${SN[r]}: double raise to 3${SY[r]}.`, 'D');
    const opts = [];
    if (l[o] >= 6) opts.push([B(3, o), `Unbalanced 15-19 with ${NUM[l[o]]} ${SN[o]}: jump rebid to 3${SY[o]}.`]);
    for (const s of others) {
      if (l[s] >= 4 && l[o] > l[s]) {
        const b = B(cheapest(s, resp), s);
        if (bv(b) > bv(bar)) opts.push([b, `Unbalanced 15-19: reverse with ${plain(b)}. It is above the barrier (2${SY[o]}), so it shows extra strength.`]);
      }
    }
    if (opts.length !== 1) return null;
    return R(opts[0][0], opts[0][1], 'D');
  }
  if (p <= 22) {
    if (l[r] >= 4) return null;
    const js = others.filter(s => l[s] >= 4);
    if (js.length !== 1) return null;
    const s = js[0], b = B(cheapest(s, resp) + 1, s);
    return R(b, `Unbalanced 20-22: jump shift to ${plain(b)}, game forcing.`, 'D');
  }
  return null;
}
// Responder's second call after opener's rebid. seq = [opening, response, rebid].
function respAfterRebid(h, seq) {
  const p = hcp(h), l = L(h), r = seq[1], x = seq[2];
  if (x === 'P' || !/^\d/.test(x)) return null;
  const rs = ST.indexOf(r[1]), rl = +r[0], xs = ST.indexOf(x[1]), xl = +x[0];
  if (xs === rs) {   // opener raised responder's suit
    if (rs < 2) return null;
    if (xl === rl + 1) {
      if (p >= 13) return R(B(4, rs), `Opener's simple raise shows 11-14. With ${p}, bid game: 4${SY[rs]}.`, 'D');
      if (p >= 11) {
        if (xl >= 3) return null;
        return R(B(3, rs), `Opener's simple raise shows 11-14. With ${p} (11-12), invite with 3${SY[rs]}.`, 'D');
      }
      return R('P', `Opener's simple raise shows 11-14. With ${p} (10 or less), pass.`, 'D');
    }
    if (xl === 3 && rl === 1) {
      if (p >= 10) return R(B(4, rs), `Opener's double raise shows 15-19. With ${p} (10+), bid 4${SY[rs]}.`, 'D');
      return R('P', `Opener's double raise shows 15-19. With ${p} (6-9), pass.`, 'D');
    }
    return null;
  }
  if (x === '1N') {
    if (l[rs] >= 5 || p > 15) return null;
    if (p <= 10) return R('P', `Opener's 1NT shows 12-14 balanced. With ${p} (10 or less), pass.`, 'D');
    if (p <= 12) return R('2N', `Opener's 1NT shows 12-14. With ${p} (11-12), invite with 2NT.`, 'D');
    return R('3N', `Opener's 1NT shows 12-14. With ${p} (13+), bid 3NT.`, 'D');
  }
  if (x === '2N' && rl === 1) {
    if (rs >= 2 && l[rs] >= 5) return null;
    if (p >= 7) return R('3N', `Opener's 2NT shows 18-19 balanced. With ${p} (7+), bid 3NT.`, 'D');
    return R('P', `Opener's 2NT shows 18-19. With only ${p}, pass.`, 'D');
  }
  return null;
}

// ---------- E: 2NT, 2♣, weak twos ----------
// Responder to 2NT (pm = 3), or to 2♣-2♦-2NT (pm = 1). pm is the most HCP that passes.
function over2Nx(h, pm) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (p > 10) return null;
  if ((H >= 5 && S >= 4) || (S >= 5 && H >= 4)) return null;
  if ((H >= 6 || S >= 6) && p > pm) {
    const M = S >= 6 ? 3 : 2;
    return R(M === 2 ? '4D' : '4H', `${Num(l[M])} ${SN[M]} with enough to play game: Texas ${M === 2 ? '4♦ → 4♥' : '4♥ → 4♠'}.`, 'E');
  }
  if (H >= 5 || S >= 5) {
    const M = S >= 5 ? 3 : 2;
    if (p > 5) return null;
    return R(M === 2 ? '3D' : '3H', `${l[M]} ${SN[M]}: transfer with ${M === 2 ? '3♦' : '3♥'}. ${p <= pm ? `Then pass with 0-${pm}.` : `Then 4${SY[M]}.`}`, 'E');
  }
  if (p <= pm) return R('P', `${p} HCP: ${pm === 3 ? '0-3 passes 2NT' : '0-1 passes 2NT here'}.`, 'E');
  if (H === 4 || S === 4) return R('3C', `${p} HCP with a 4-card major: 3♣ Stayman.`, 'E');
  return R('3N', `${p} HCP, no major: 3NT.`, 'E');
}
function over2C(h) {
  const p = hcp(h), l = L(h), bal = isBal(h);
  if (p <= 7) return R('2D', `${p} HCP: 2♦ negative (0-7).`, 'E');
  if (p > 12) return null;
  const five = l.some(n => n >= 5);
  if (bal && !five) {
    if (l[2] === 4 || l[3] === 4) return null;
    if (p <= 9) return R('2N', `Balanced ${p}: 2NT positive (8-9).`, 'E');
    return R('3N', `Balanced ${p}: 3NT positive (10-12).`, 'E');
  }
  const c = [2, 3].filter(s => l[s] >= 4).concat([0, 1].filter(s => l[s] >= 5));
  if (!c.length) return null;
  const mx = Math.max(...c.map(s => l[s])), t = c.filter(s => l[s] === mx);
  if (t.length > 1) return null;
  const s = t[0];
  return s >= 2 ? R(B(2, s), `${p} HCP positive with ${l[s]} ${SN[s]}: 2${SY[s]} (4+ major).`, 'E')
    : R(B(3, s), `${p} HCP positive with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`, 'E');
}
// 2♣ opener's rebid after 2♦.
function twoClubRebid(h) {
  const p = hcp(h), l = L(h), bal = isBal(h);
  if (p > 27) return null;
  if (bal) {
    if (l[2] >= 5 || l[3] >= 5) return null;
    if (p <= 24) return R('2N', `Balanced ${p}: 2NT shows 23-24.`, 'E');
    return R('3N', `Balanced ${p}: 3NT shows 25-27.`, 'E');
  }
  const c = [0, 1, 2, 3].filter(s => l[s] >= 5);
  if (!c.length) return null;
  const mx = Math.max(...c.map(s => l[s])), t = c.filter(s => l[s] === mx);
  if (t.length > 1) return null;
  const s = t[0];
  return s >= 2 ? R(B(2, s), `Unbalanced with ${l[s]} ${SN[s]}: 2${SY[s]} (5+ suit).`, 'E')
    : R(B(3, s), `Unbalanced with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`, 'E');
}
// Responder to a weak two in M.
function wtResp(h, M) {
  const p = hcp(h), t = L(h)[M];
  if (p >= 14) {
    if (t >= 4) return null;
    return R('2N', `${p} HCP: 2NT asks (14+). Opener shows a feature or a minimum.`, 'E');
  }
  if (t >= 4) return R(B(4, M), `${t} trumps: raise to 4${SY[M]}.`, 'E');
  if (t === 3) return R(B(3, M), `3 trumps: raise to 3${SY[M]}.`, 'E');
  return R('P', `${t} ${SN[M]} and under 14 HCP: pass.`, 'E');
}
// Weak-two opener answers the 2NT ask.
function wtAns(h, M) {
  const p = hcp(h);
  if (has(h, M, 14) && has(h, M, 13) && has(h, M, 12)) return R('3N', `Solid AKQ in ${SN[M]}: 3NT.`, 'E');
  const f = [0, 1, 2, 3].filter(s => s !== M && (has(h, s, 14) || has(h, s, 13)));
  if (p <= 7) return R(B(3, M), `${p} HCP is a minimum (5-7): 3${SY[M]}.`, 'E');
  if (!f.length) return R(B(3, M), `${p} HCP but no outside ace or king: 3${SY[M]} (no feature).`, 'E');
  if (f.length > 1) return null;
  const s = f[0];
  return R(B(3, s), `${p} HCP (8-10) with an outside ${has(h, s, 14) ? 'ace' : 'king'} in ${SN[s]}: show the feature with 3${SY[s]}.`, 'E');
}

// ---------- F: competitive ----------
// RHO opened 1 of suit x.
function overcall(h, x) {
  const p = hcp(h), l = L(h), bal = isBal(h), un = [0, 1, 2, 3].filter(s => s !== x), five = un.filter(s => l[s] >= 5);
  const two = (p >= 6 && p <= 10) || p >= 16;   // two-suited bids: weak or strong, not in between
  let mich, om = null;
  if (x <= 1) mich = l[2] >= 5 && l[3] >= 5;
  else { om = x === 2 ? 3 : 2; mich = l[om] >= 5 && (l[0] >= 5 || l[1] >= 5); }
  const low = un.slice(0, 2), unus = l[low[0]] >= 5 && l[low[1]] >= 5;
  if (mich || unus) {
    if (!two) return null;
    if (mich) return R(B(2, x), `5-5 with ${x <= 1 ? 'both majors' : `${SN[om]} and a minor`} and ${p} HCP (6-10 or 16+): Michaels cue bid 2${SY[x]}.`, 'F');
    return R('2N', `5-5 in the two lowest unbid suits (${SN[low[0]]} and ${SN[low[1]]}), ${p} HCP: Unusual 2NT.`, 'F');
  }
  if (five.length >= 2) return null;
  if (bal && p >= 15 && p <= 18) {
    if (stop(h, x)) return R('1N', `${p} HCP balanced with a ${SN[x]} stopper: 1NT overcall (15-18).`, 'F');
    return null;
  }
  if (p >= 12 && five.length === 0 && un.every(s => l[s] >= 3)) return R('X', `${p} HCP with 3+ cards in every unbid suit: takeout double.`, 'F');
  if (five.length === 1) {
    const s = five[0], n = l[s], lv = s > x ? 1 : 2;
    if (lv === 1) {
      if (n >= 6 && p >= 6 && p <= 7) return R(B(2, s), `${Num(n)} ${SN[s]} and ${p} HCP: weak jump overcall 2${SY[s]} (6+ suit, 6-10).`, 'F');
      if (n >= 6 && p >= 8 && p <= 10) return null;
      if (p >= 8 && p <= 15 && good(h, s)) return R(B(1, s), `${n} good ${SN[s]} and ${p} HCP: 1${SY[s]} overcall (5+ good suit, 8+).`, 'F');
      return null;
    }
    if (n >= 6 && p >= 6 && p <= 9) return R(B(3, s), `${Num(n)} ${SN[s]} and ${p} HCP: weak jump overcall 3${SY[s]} (6+ suit, 6-10).`, 'F');
    if (n >= 6 && p >= 11 && p <= 15 && good(h, s)) return R(B(2, s), `${Num(n)} good ${SN[s]}, ${p} HCP: 2-level overcall 2${SY[s]} (6+ suit, 10+).`, 'F');
    return null;
  }
  if (p <= 9) return R('P', `${p} HCP with no 5-card suit of your own and not enough to double: pass.`, 'F');
  return null;
}
// Partner opened 1 of suit o, RHO overcalled 1 of suit v.
function negDbl(h, o, v) {
  const p = hcp(h), l = L(h);
  let need, show;
  if (o === 0 && v === 1) { need = l[2] === 4 && l[3] === 4; show = '4-4 in the majors'; }
  else if (o <= 1 && v === 2) { need = l[3] === 4; show = 'four spades'; }
  else if (o <= 1 && v === 3) { need = l[2] === 4; show = 'four hearts'; }
  else { need = l[0] >= 4 && l[1] >= 4; show = 'both minors'; }
  if (need && p >= 6) return R('X', `Negative double: shows ${show} and 6+ (the overcall was at the 1-level).`, 'F');
  if (p <= 5) return R('P', `Only ${p} HCP: a negative double over a 1-level overcall needs 6+. Pass.`, 'F');
  return null;
}
// LHO opened 1 of suit x, partner doubled for takeout, RHO passed.
function advance(h, x) {
  const p = hcp(h), l = L(h), un = [0, 1, 2, 3].filter(s => s !== x);
  const mx = Math.max(...un.map(s => l[s])), longs = un.filter(s => l[s] === mx);
  if (longs.length > 1 || p > 15) return null;
  const s = longs[0], lv = s > x ? 1 : 2;
  if (p <= 8) return R(B(lv, s), `${p} HCP (0-8): bid your longest suit at the lowest level, ${plain(B(lv, s))}. Never pass a takeout double.`, 'F');
  if (p <= 11) return R(B(lv + 1, s), `${p} HCP (9-11): jump in your longest suit, ${plain(B(lv + 1, s))}.`, 'F');
  const g = s >= 2 ? B(4, s) : B(5, s);
  return R(g, `${p} HCP (12+): bid game in your longest suit, ${plain(g)}.`, 'F');
}
// RHO opened a strong 1NT; we play Cappelletti.
function vs1NT(h) {
  const p = hcp(h), l = L(h), [C, D, H, S] = l;
  if (p < 8) return R('P', `${p} HCP: Cappelletti actions need 8+. Pass.`, 'F');
  if (p >= 16) {
    if (isBal(h)) return R('X', `${p} HCP balanced: double is penalty (16+).`, 'F');
    return null;
  }
  if (H >= 4 && S >= 4 && (H >= 5 || S >= 5)) return R('2D', `${H} hearts and ${S} spades: 2♦ shows both majors.`, 'F');
  if (H >= 5 && S <= 3 && (C >= 4 || D >= 4)) return R('2H', `Hearts plus a 4+ minor: 2♥ (hearts and a minor).`, 'F');
  if (S >= 5 && H <= 3 && (C >= 4 || D >= 4)) return R('2S', `Spades plus a 4+ minor: 2♠ (spades and a minor).`, 'F');
  if (C >= 5 && D >= 5) return R('2N', `5-5 in the minors: 2NT.`, 'F');
  const six = [0, 1, 2, 3].filter(s => l[s] >= 6);
  if (six.length === 1 && l.filter(n => n >= 4).length === 1) return R('2C', `One long suit (${l[six[0]]} ${SN[six[0]]}): 2♣ shows any one-suiter. Partner relays 2♦${six[0] === 1 ? ' and you pass' : ` and you bid ${SN[six[0]]}`}.`, 'F');
  if (isBal(h)) return R('P', `Balanced ${p} HCP with no two-suiter: pass. Double needs 16+.`, 'F');
  return null;
}

// ---------- G: Roman Key Card Blackwood (5♣ = 0 or 3, 5♦ = 1 or 4) ----------
// Key cards are the four aces and the trump king.
const kcList = (h, M) => [0, 1, 2, 3].filter(s => has(h, s, 14)).map(s => cardName(s, 14)).concat(has(h, M, 13) ? [cardName(M, 13)] : []);
// Answer partner's 4NT.
function rkReply(h, M) {
  const k = kcList(h, M), n = k.length, q = has(h, M, 12);
  const list = n ? `Key cards: ${k.join(', ')} = ${n}.` : 'No key cards.';
  if (n === 0 || n === 3) return R('5C', `${list} 5♣ shows 0 or 3.`, 'G');
  if (n === 1 || n === 4) return R('5D', `${list} 5♦ shows 1 or 4.`, 'G');
  if (n === 2) return q ? R('5S', `${list} You hold the ${SY[M]}Q: 5♠ = 2 with the queen.`, 'G') : R('5H', `${list} No trump queen: 5♥ = 2 without the queen.`, 'G');
  return null;   // all five key cards: the chart has no reply for this
}
// The 4NT bidder decides after partner's reply.
function askDecide(h, M, reply) {
  const k = kcList(h, M).length;
  let poss = reply === '5C' ? [0, 3] : reply === '5D' ? [1, 4] : [2];
  poss = poss.filter(v => v + k <= 5);
  if (poss.length !== 1) return null;
  const pk = poss[0], tot = k + pk, miss = 5 - tot, rv = bv(reply), five = bv(B(5, M));
  const head = `You hold ${k}, partner's ${plain(reply)} shows ${reply === '5C' ? '0 or 3' : reply === '5D' ? '1 or 4' : '2'} so ${pk} here: ${tot} of 5.`;
  if (miss >= 2) {
    if (rv < five) return R(B(5, M), `${head} Missing two: sign off in 5${SY[M]}.`, 'G');
    if (rv === five) return R('P', `${head} Missing two, and partner's reply is already 5${SY[M]}: pass.`, 'G');
    return null;
  }
  if (miss === 1) return R(B(6, M), `${head} Missing one: bid 6${SY[M]}.`, 'G');
  return R('5N', `${head} All five key cards: 5NT asks for kings.`, 'G');
}
