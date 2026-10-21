// The chart: one function per decision. Each takes a hand (plus what it needs to know
// about the auction) and returns R(bid, why, ruleId), or, when there is no single call:
//   amb(why)  the chart allows more than one call (ambiguous)
//   gap(why)  the chart has no call here at all
// The drill builder relies on this: a hand whose first call is not a single chart call is
// never dealt, and an auction stops at the first amb() or gap(), showing its reason.
// So when a rule could fairly be read two ways, return amb() rather than guess.
//
// Rule ids are 'chart.name', e.g. 'A.stayman'. The chart letter is shown under each answer;
// the full id lets tests and (later) per-topic scores refer to one rule.
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
  if (p >= 23) return R('2C', `${p} HCP. 23+ opens 2♣ with any shape. It is game forcing.`, 'E.open-2c');
  if (bal && !fiveM) {
    if (p <= 11) return R('P', `${p} HCP balanced. A balanced 1♣/1♦ opening shows 12-14, so pass.`, 'OB.pass');
    if (p <= 14) return R(minorOpen(l), `${p} HCP balanced with no 5-card major: open a minor (balanced 12-14). ${minorWhy(l)}`, 'OB.minor');
    if (p <= 17) return R('1N', `${p} HCP balanced: open 1NT (15-17).`, 'A.open-1nt');
    if (p <= 19) return R(minorOpen(l), `${p} HCP balanced: 18-19 opens a minor, planning to rebid 2NT. ${minorWhy(l)}`, 'OB.minor-18-19');
    return R('2N', `${p} HCP balanced: open 2NT (20-22).`, 'E.open-2nt');
  }
  if (bal && fiveM) {
    if ((p >= 15 && p <= 17) || p >= 20) return amb('A balanced hand with a five-card major and 15-17 or 20-22 can open no-trump or the major.');   // 1NT/2NT or 1M: chart allows both
    const M = l[3] >= 5 ? 3 : 2;
    if (p <= 10) return R('P', `${p} HCP: a 1-level opening needs 11+, and a 5-card suit is too short for a weak two. Pass.`, 'OB.pass');
    return R(B(1, M), `${p} HCP with five ${SN[M]}: open 1${SY[M]} (5-card major, 11-22).`, 'OB.major');
  }
  if (p >= 11) {
    if (fiveM) {
      const M = l[3] > l[2] ? 3 : 2;
      return R(B(1, M), `${p} HCP, unbalanced, with a 5+ card major: open 1${SY[M]}. ${l[2] === l[3] ? 'Equal-length majors open 1♥.' : 'Open the longer major.'}`, 'OB.major');
    }
    if (l[0] >= 5 && l[0] === l[1]) return amb('With 5-5 or 6-6 in the minors, the chart does not say which minor to open.');   // 5-5 or 6-6 minors
    return R(minorOpen(l), `${p} HCP, unbalanced, no 5-card major: open a minor. ${minorWhy(l)}`, 'OB.minor');
  }
  // 0-10 HCP: pre-empts and weak twos
  const mx = Math.max(...l), longs = [0, 1, 2, 3].filter(s => l[s] === mx);
  if (mx >= 6 && longs.length > 1) return gap('The chart has no opening for a weak hand with two long suits.');
  if (mx >= 9) return gap('The chart has no opening for a nine-card suit.');
  const s = longs[0];
  if (mx === 8) return R(B(4, s), `${p} HCP with eight ${SN[s]}: pre-empt at the 4-level (8-card suit, 0-10 HCP).`, 'E.preempt');
  if (mx === 7) return R(B(3, s), `${p} HCP with seven ${SN[s]}: pre-empt at the 3-level (7-card suit, 0-10 HCP).`, 'E.preempt');
  if (mx === 6 && s > 0 && p >= 5) return R(B(2, s), `${p} HCP with six ${SN[s]}: weak two (5-10 HCP, 6-card suit).`, 'E.weak-two');
  if (mx === 6 && s === 0) return R('P', `${p} HCP is too weak to open 1♣, and 2♣ is the strong opening, so there is no weak two in clubs. Pass.`, 'E.pass-no-weak-two');
  if (mx === 6) return R('P', `${p} HCP is below the 5-10 range for a weak two. Pass.`, 'E.pass-no-weak-two');
  return R('P', `${p} HCP and no 6-card suit for a weak two: a 1-level opening needs 11+. Pass.`, 'OB.pass');
}

// ---------- A: responses to 1NT ----------
function r1NT(h) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (H >= 5 && S >= 5) return amb('With 5-5 in the majors, the chart allows a transfer to either major.');
  if ((H >= 6 || S >= 6) && Math.min(H, S) >= 4) return amb('With six cards in one major and four in the other, the chart allows Stayman or a transfer.');
  if (H >= 6 || S >= 6) {
    const M = S >= 6 ? 3 : 2;
    if (p >= 16) return gap('The chart has no call for a six-card major with 16+ opposite 1NT.');
    if (p >= 10) return R(M === 2 ? '4D' : '4H', `Six+ ${SN[M]} and ${p} HCP: Texas transfer, ${M === 2 ? '4♦ → 4♥' : '4♥ → 4♠'} (6+ major, 10+, to play).`, 'A.texas');
    return R(M === 2 ? '2D' : '2H', `${Num(l[M])} ${SN[M]}, ${p} HCP: transfer with ${M === 2 ? '2♦' : '2♥'}. ${p <= 7 ? 'Then pass the completion.' : `Then 3${SY[M]} invites (6+ cards, 8-9).`}`, 'A.transfer');
  }
  if ((H === 5 && S === 4) || (S === 5 && H === 4)) {
    const f = H === 5 ? 2 : 3, o = f === 3 ? 2 : 3;
    return R('2C', `5-4 in the majors: start with 2♣ Stayman. ${p <= 7 ? `Weak (0-7): over 2♦ bid 2${SY[f]} to play; over 2${SY[o]} pass the fit.` : p <= 9 ? 'With 8-9 you invite after opener replies.' : `Game forcing: over 2♦ use Smolen, 3${SY[o]} = five ${SN[f]} + four ${SN[o]}.`}`, 'A.stayman-5-4');
  }
  if (H === 5 || S === 5) {
    const M = S === 5 ? 3 : 2;
    if (p >= 15) return gap('The chart has no call for a five-card major with 15+ opposite 1NT.');
    return R(M === 2 ? '2D' : '2H', `Five ${SN[M]}: transfer with ${M === 2 ? '2♦' : '2♥'} (5+ major, any strength). ${p <= 7 ? 'Weak: pass the completion.' : p <= 9 ? 'Then 2NT invites (8-9).' : 'Then 3NT (10-14) lets opener choose.'}`, 'A.transfer');
  }
  if (H === 4 || S === 4) {
    if (p >= 8) return R('2C', `${p} HCP with a 4-card major: 2♣ Stayman (8+).`, 'A.stayman');
    if (l[0] >= 6 || l[1] >= 6) {
      const m = l[0] >= 6 ? 0 : 1;
      return R('2S', `Weak with six ${SN[m]}: 2♠, then 3${SY[m]} to play.`, 'A.weak-minor');
    }
    return R('P', `${p} HCP: Stayman needs 8+. With 0-7, pass 1NT.`, 'A.pass');
  }
  if (p <= 7) {
    if (l[0] >= 6 || l[1] >= 6) {
      const m = l[0] >= 6 ? 0 : 1;
      return R('2S', `Weak (${p}) with six ${SN[m]}: 2♠ (range-ask or weak long minor). Over opener's reply, ${m === 0 ? 'pass 3♣ or bid 3♣ over 2NT' : 'bid 3♦'} to play.`, 'A.weak-minor');
    }
    return R('P', `${p} HCP with no long suit: 0-7 passes 1NT.`, 'A.pass');
  }
  if (Math.min(...l) <= 1) return gap('The chart has no call opposite 1NT for an unbalanced hand with no major and 8+.');
  if (p === 8) return R('2S', '8 HCP, no 4-card major: 2♠ McKendrick range-ask. Opener shows 15-16 (2NT) or 17 (3♣).', 'A.range-ask');
  if (p === 9) return R('2N', '9 HCP, no major: 2NT invites. Opener passes with 15, bids 3NT with 16-17.', 'A.invite-2nt');
  if (p <= 15) return R('3N', `${p} HCP balanced, no 4-card major: 3NT (10-15).`, 'A.game-3nt');
  if (p <= 17) return R('4N', `${p} HCP balanced: 4NT quantitative (16-17). Opener passes with 15, bids 6NT with 16-17.`, 'A.quantitative');
  return gap('The chart has no call for 18+ opposite 1NT.');
}
// Opener answers Stayman.
function stayAns(h) {
  const l = L(h);
  if (l[2] >= 4) return R('2H', `Four hearts: 2♥${l[3] >= 4 ? ' (you may also hold four spades)' : ''}.`, 'A.stayman-answer');
  if (l[3] >= 4) return R('2S', 'Four spades, at most three hearts: 2♠.', 'A.stayman-answer');
  return R('2D', 'No 4-card major: 2♦.', 'A.stayman-answer');
}
// Responder's second call after Stayman; rep is opener's answer.
function afterStay(h, rep) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3], f54 = (H === 5 && S === 4) ? 2 : (S === 5 && H === 4) ? 3 : -1;
  if (p > 15) return gap('The chart has no continuation after Stayman with 16+.');
  if (rep === '2D') {
    if (f54 >= 0) {
      const o = f54 === 3 ? 2 : 3;
      if (p <= 7) return R(B(2, f54), `Weak 5-4 (0-7): 2${SY[f54]} to play.`, 'A.stayman-weak');
      if (p <= 9) return R('2N', `8-9 HCP: 2NT invites.`, 'A.stayman-invite');
      return R(B(3, o), `Game force with five ${SN[f54]} and four ${SN[o]}: Smolen 3${SY[o]}. Opener bids 4${SY[f54]} with 3+, else 3NT.`, 'A.smolen');
    }
    if (p <= 9) return R('2N', `No fit, 8-9 HCP: 2NT invites.`, 'A.stayman-invite');
    return R('3N', `No fit, ${p} HCP: 3NT (10+).`, 'A.stayman-game');
  }
  const M = rep === '2H' ? 2 : 3;
  if (l[M] >= 4) {
    if (p <= 7) return R('P', `Weak 5-4 and a ${SN[M]} fit: pass.`, 'A.stayman-weak');
    if (p <= 9) return R(B(3, M), `Fit, 8-9 HCP: 3${SY[M]} invites.`, 'A.stayman-invite');
    return R(B(4, M), `Fit, ${p} HCP: 4${SY[M]}.`, 'A.stayman-game');
  }
  if (p <= 7) return gap('The chart has no weak continuation after Stayman without a fit.');
  if (p <= 9) return R('2N', `No fit, 8-9 HCP: 2NT invites.`, 'A.stayman-invite');
  if (M === 2) return R('2S', `Four spades, no heart fit, ${p} HCP: 2♠ is game forcing. Opener bids 4♠ with four, else 3NT.`, 'A.stayman-2s');
  return R('3N', `No fit, ${p} HCP: 3NT.`, 'A.stayman-game');
}
// Responder's second call after a transfer to M was completed.
function afterXfer(h, M) {
  const p = hcp(h), t = L(h)[M];
  if (p <= 7) return R('P', `${p} HCP (0-7): pass the completion.`, 'A.transfer-pass');
  if (p <= 9) return t >= 6 ? R(B(3, M), `${Num(t)} ${SN[M]}, 8-9 HCP: 3${SY[M]} invites.`, 'A.transfer-invite') : R('2N', `Five ${SN[M]}, 8-9 HCP: 2NT invites.`, 'A.transfer-invite');
  if (t === 5 && p <= 14) return R('3N', `Five ${SN[M]}, ${p} HCP: 3NT. Opener passes or corrects to 4${SY[M]} with 3+.`, 'A.transfer-game');
  return gap('The chart has no continuation after the transfer for this hand.');
}
// Opener answers a 2NT or 3M invitation.
function inv(h) {
  const p = hcp(h);
  return p <= 15 ? R('P', `${p} HCP is a minimum (15): pass the invitation.`, 'A.invite-answer') : R('3N', `${p} HCP is a maximum (16-17): accept with 3NT.`, 'A.invite-answer');
}
function inv4(h, M) {
  const p = hcp(h);
  return p <= 15 ? R('P', `${p} HCP is a minimum (15): pass 3${SY[M]}.`, 'A.invite-answer') : R(B(4, M), `${p} HCP is a maximum (16-17): accept with 4${SY[M]}.`, 'A.invite-answer');
}
// Opener answers Smolen; f is responder's 5-card major.
function smolenAns(h, f) {
  const t = L(h)[f];
  return t >= 3 ? R(B(4, f), `Smolen shows five ${SN[f]}. With ${t} ${SN[f]}, bid 4${SY[f]}.`, 'A.smolen-answer') : R('3N', `Smolen shows five ${SN[f]}. With only ${t}, bid 3NT.`, 'A.smolen-answer');
}
// Opener answers the 2♠ range-ask.
function rangeAns(h) {
  const p = hcp(h);
  return p <= 16 ? R('2N', `Answering the 2♠ range-ask: ${p} HCP, so 2NT (15-16).`, 'A.range-ask-answer') : R('3C', 'Answering the 2♠ range-ask: 17 HCP, so 3♣ (maximum).', 'A.range-ask-answer');
}
// Responder after opener answers 2♠: either the 8-count range-ask or the weak long minor.
// An 8-count with a six-card minor used the range-ask, so it is not "weak" here.
function rangeResp(h, rep) {
  const l = L(h), p = hcp(h), wm = p > 7 ? -1 : l[0] >= 6 ? 0 : l[1] >= 6 ? 1 : -1;
  if (wm < 0) {
    if (p !== 8) return gap('The chart has no call here after the range-ask.');
    return rep === '2N' ? R('P', 'You have 8 and opener showed 15-16 with 2NT: pass.', 'A.range-ask-continue') : R('3N', 'You have 8 and opener showed 17 with 3♣: bid 3NT.', 'A.range-ask-continue');
  }
  if (rep === '2N') return R(B(3, wm), `Weak with long ${SN[wm]}: 3${SY[wm]} to play.`, 'A.weak-minor-signoff');
  return wm === 0 ? R('P', 'Weak with long clubs: pass 3♣.', 'A.weak-minor-signoff') : R('3D', 'Weak with long diamonds: 3♦ to play.', 'A.weak-minor-signoff');
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
  if (t >= 5 && p <= 6) return R(B(4, M), `${t} trumps and only ${p} HCP: jump to 4${SY[M]}, the weak raise (5+ trumps, to play).`, 'B.weak-raise');
  if (t >= 4) {
    if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
    if (p === 6) return gap('The chart has no raise for four trumps and exactly 6 HCP.');
    if (p <= 9) return R('3D', `${t}-card support and ${p} HCP: 3♦ shows 4+ trumps, 7-9.`, 'B.bergen-3d');
    if (p <= 12) return R('3C', `${t}-card support and ${p} HCP: 3♣ shows 4+ trumps, 10-12.`, 'B.bergen-3c');
    return R('2N', `${t}-card support and ${p} HCP: Jacoby 2NT (4+ trumps, 13+, game forcing).`, 'B.jacoby');
  }
  if (t === 3) {
    if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
    if (p <= 9) return R(B(2, M), `3-card support, ${p} HCP: simple raise to 2${SY[M]} (6-9).`, 'B.raise');
    if (p <= 12) return R(B(3, M), `3-card support, ${p} HCP: limit raise to 3${SY[M]} (10-12).`, 'B.limit-raise');
    const n = newSuitM(h, M);
    return R(n, `3-card support with ${p} HCP: bid a new suit first (${plain(n)}, forcing), then support. It leaves room for slam.`, 'B.new-suit-then-support');
  }
  if (p <= 5) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
  if (M === 2 && l[3] >= 4) return R('1S', `Fewer than 3 hearts and ${l[3]} spades: 1♠ (4+ spades, 6+, forcing).`, 'B.one-spade');
  if (p <= 8) return R('1N', `Fewer than 3 ${SN[M]} and ${p} HCP: 1NT (6-10, any shape, not forcing).`, 'B.1nt');
  if (p <= 10) return amb('With 9-10 and fewer than three trumps, the chart allows 1NT or a new suit.');
  const n = newSuitM(h, M);
  return R(n, `Fewer than 3 ${SN[M]} and ${p} HCP: new suit at the 2-level (9+, forcing). Bid the longest; with equal length, the lower.`, 'B.new-suit');
}
// Opener answers Jacoby 2NT.
function jac(h, M) {
  const p = hcp(h), l = L(h);
  const short = [0, 1, 2, 3].filter(s => s !== M && l[s] <= 1);
  const g5 = [0, 1, 2, 3].filter(s => s !== M && l[s] >= 5 && [14, 13, 12].filter(r => has(h, s, r)).length >= 2);
  if (short.length > 1 || (short.length && g5.length) || g5.length > 1) return amb('Opener has more than one feature to show over Jacoby 2NT.');
  if (short.length) {
    const s = short[0];
    return R(B(3, s), `${l[s] === 0 ? 'Void' : 'Singleton'} in ${SN[s]}: show it with 3${SY[s]}.`, 'B.jacoby-shortness');
  }
  if (g5.length) {
    const s = g5[0];
    if (M === 2 && s === 3) return gap('The chart has no way to show a good spade suit over 1♥ – 2NT.');
    return R(B(4, s), `Good 5-card ${SN[s]} suit: 4${SY[s]}.`, 'B.jacoby-side-suit');
  }
  if (p <= 14) return R(B(4, M), `Flat minimum (${p}): 4${SY[M]} shows 11-14 with no shortness.`, 'B.jacoby-flat');
  if (p <= 17) return R('3N', `Flat ${p}: 3NT shows 15-17 with no shortness.`, 'B.jacoby-flat');
  return R(B(3, M), `Flat ${p}: 3${SY[M]} shows 18+ with no shortness.`, 'B.jacoby-flat');
}
// Jacoby responder after opener's flat answer x: settle or ask for key cards.
function jacCont(h, M, x) {
  const p = hcp(h), G = ' (Trainer guide: about 31+ combined points with a fit is enough to ask for key cards.)';
  if (x === B(4, M)) {
    if (p <= 16) return R('P', `Opener's 4${SY[M]} shows a flat 11-14. With ${p} you have at most ${p + 14} combined: pass.`, 'B.jacoby-signoff');
    if (p >= 20) return R('4N', `Opener has 11-14. With ${p} you have at least ${p + 11} combined and a fit: 4NT RKCB.${G}`, 'G.rkcb-ask');
    return gap('With 17-19 opposite a minimum, the chart gives neither a pass nor RKCB.');
  }
  if (x === '3N') {
    if (p <= 13) return R(B(4, M), `Opener's 3NT shows a flat 15-17. With ${p}, settle for 4${SY[M]}.`, 'B.jacoby-signoff');
    if (p >= 16) return R('4N', `Opener has 15-17. With ${p} you have at least ${p + 15} combined: 4NT RKCB.${G}`, 'G.rkcb-ask');
    return gap('With 14-15 opposite 15-17, the chart gives neither game nor RKCB.');
  }
  if (x === B(3, M)) return R('4N', `Opener's 3${SY[M]} shows a flat 18+. With ${p} you have at least ${p + 18} combined: 4NT RKCB.${G}`, 'G.rkcb-ask');
  return gap('The chart has no continuation after opener shows shortness or a side suit.');
}

// ---------- C: responses to 1♣/1♦ ----------
function r1m(h, m) {
  const p = hcp(h), l = L(h), bal = isBal(h), maj = l[2] >= 4 || l[3] >= 4;
  if (p <= 5) return R('P', `${p} HCP: a response needs 6+. Pass.`, 'C.pass');
  let pre = '';
  if (bal && !maj) {
    if (p <= 10) return R('1N', `${p} HCP balanced with no 4-card major: 1NT (6-10).`, 'C.1nt');
    if (p <= 12) return R('2N', `${p} HCP balanced with no major: 2NT (11-12).`, 'C.2nt');
    if (p <= 15) return R('3N', `${p} HCP balanced with no major: 3NT (13-15).`, 'C.3nt');
    pre = `With 16+ balanced, bid a new suit first, then 4NT quantitative. `;
  }
  const c = [0, 1, 2, 3].filter(s => s !== m);
  let b = c[0];
  for (const s of c) if (l[s] > l[b]) b = s;
  if (l[m] > l[b]) return gap('The longest suit is the opening minor, and the chart has no minor raises.');
  const lv = b > m ? 1 : 2;
  if (lv === 2 && p < 9) return gap('The longest suit could only be bid at the 2-level, which needs 9+.');
  const tie = c.filter(s => l[s] === l[b]).length > 1;
  return R(B(lv, b), `${pre}${pre ? '' : `${p} HCP: `}new suit, longest first${tie ? ' (equal length: bid the lower)' : ''}: ${plain(B(lv, b))}. ${lv === 1 ? '1-level needs 6+' : '2-level needs 9+'}; forcing.`, 'C.new-suit');
}

// ---------- D: opener's rebid ----------
// o = opener's suit, r = responder's new suit, lvl = the level responder bid it at.
function rebid(h, o, r, lvl) {
  const p = hcp(h), l = L(h), bal = isBal(h), resp = B(lvl, r), bar = B(2, o), others = [0, 1, 2, 3].filter(s => s !== o && s !== r);
  if (bal) {
    if (r >= 2 && l[r] >= 4) return amb('Balanced with four-card support for partner: the chart allows a raise or a no-trump rebid.');
    if (lvl === 1 && others.some(s => s >= 2 && s > r && l[s] >= 4)) return amb('Balanced with a four-card major to show at the 1-level: the chart allows the major or no-trump.');
    if (p >= 12 && p <= 14) return R(lvl === 1 ? '1N' : '2N', `Balanced 12-14: rebid ${lvl === 1 ? '1NT' : '2NT (after a 2-level response)'}.`, 'D.nt-12-14');
    if (p >= 18 && p <= 19) return R(lvl === 1 ? '2N' : '3N', `Balanced 18-19: rebid ${lvl === 1 ? '2NT' : '3NT (after a 2-level response)'}.`, 'D.nt-18-19');
    return gap('The chart has no rebid for a balanced hand of this strength.');
  }
  if (p <= 14) {
    if (l[r] >= 4) return R(B(lvl + 1, r), `Unbalanced 11-14 with ${l[r]} ${SN[r]}: simple raise to ${plain(B(lvl + 1, r))}.`, 'D.raise');
    if (l[o] >= 6) return R(B(2, o), `Unbalanced 11-14 with ${NUM[l[o]]} ${SN[o]}: simple rebid of 2${SY[o]}.`, 'D.rebid-suit');
    const below = others.filter(s => l[s] >= 4 && bv(B(cheapest(s, resp), s)) <= bv(bar));
    if (below.length > 1) return amb('More than one four-card suit could be shown below the barrier.');
    if (below.length === 1) {
      const s = below[0], b = B(cheapest(s, resp), s);
      return R(b, `Unbalanced 11-14: show the 4-card ${SN[s]} suit with ${plain(b)}. It sits below the barrier (2${SY[o]}), so it shows no extra strength.`, 'D.new-suit');
    }
    if (l[o] >= 5) return R(B(2, o), `Unbalanced 11-14 with nothing else to show: simple rebid of your 5-card suit, 2${SY[o]}.`, 'D.rebid-suit');
    return gap('The chart has no minimum rebid for this hand.');
  }
  if (lvl !== 1) return gap('The chart has no rebid with 15+ after a 2-level response.');
  if (p <= 19) {
    if (l[r] >= 4) return R(B(3, r), `Unbalanced 15-19 with ${l[r]} ${SN[r]}: double raise to 3${SY[r]}.`, 'D.double-raise');
    const opts = [];
    if (l[o] >= 6) opts.push([B(3, o), `Unbalanced 15-19 with ${NUM[l[o]]} ${SN[o]}: jump rebid to 3${SY[o]}.`, 'D.jump-rebid']);
    for (const s of others) {
      if (l[s] >= 4 && l[o] > l[s]) {
        const b = B(cheapest(s, resp), s);
        if (bv(b) > bv(bar)) opts.push([b, `Unbalanced 15-19: reverse with ${plain(b)}. It is above the barrier (2${SY[o]}), so it shows extra strength.`, 'D.reverse']);
      }
    }
    if (opts.length > 1) return amb('The chart allows more than one strong rebid here.');
    if (!opts.length) return gap('The chart has no strong rebid for this hand.');
    return R(...opts[0]);
  }
  if (p <= 22) {
    if (l[r] >= 4) return gap('The chart has no rebid for 20-22 with four-card support.');
    const js = others.filter(s => l[s] >= 4);
    if (js.length > 1) return amb('The chart allows a jump shift in more than one suit.');
    if (!js.length) return gap('The chart has no rebid for 20-22 without a second suit.');
    const s = js[0], b = B(cheapest(s, resp) + 1, s);
    return R(b, `Unbalanced 20-22: jump shift to ${plain(b)}, game forcing.`, 'D.jump-shift');
  }
  return gap('The chart has no rebid for this hand.');
}
// Responder's second call after "new suit first, then support" (B.new-suit-then-support:
// 3-card support for opener's major M and 13+). r = responder's new suit, x = opener's
// rebid, which is not a raise of r.
function supportAfterNewSuit(h, M, r, x) {
  const p = hcp(h), xs = ST.indexOf(x[1]), rs = ST.indexOf(r[1]);
  // Opener's minimum (11-14) rebids: 1NT, 2NT after a 2-level response, 2M, or a new suit below the barrier.
  const minimum = x === '1N' || (x === '2N' && r[0] === '2') || x === B(2, M)
    || (xs < 4 && xs !== M && xs !== rs && +x[0] === cheapest(xs, r) && bv(x) <= bv(B(2, M)));
  if (!minimum) return gap('Opener showed extra values, and the chart has no slam route after a new suit with three-card support.');
  // As after Jacoby: at most 16 + 14 = 30 combined, so no slam.
  if (p >= 17) return gap('With 17+ opposite a minimum, slam is possible, and the chart has no slam route here.');
  return R(B(4, M), `You bid a new suit first, holding three-card support for ${SN[M]} and 13+. Opener's rebid shows a minimum (11-14), so now support: 4${SY[M]}.`, 'B.support-after-new-suit');
}
// Responder's second call after opener's rebid. seq = [opening, response, rebid].
function respAfterRebid(h, seq) {
  const p = hcp(h), l = L(h), r = seq[1], x = seq[2];
  if (x === 'P' || !/^\d/.test(x)) return gap('The chart has no call here.');
  const rs = ST.indexOf(r[1]), rl = +r[0], xs = ST.indexOf(x[1]), xl = +x[0];
  if (xs === rs) {   // opener raised responder's suit
    if (rs < 2) return gap('The chart has no continuation after opener raises a minor.');
    if (xl === rl + 1) {
      if (p >= 13) return R(B(4, rs), `Opener's simple raise shows 11-14. With ${p}, bid game: 4${SY[rs]}.`, 'D.after-raise');
      if (p >= 11) {
        if (xl >= 3) return gap('After a raise to the 3-level, the chart gives no call with 11-12.');
        return R(B(3, rs), `Opener's simple raise shows 11-14. With ${p} (11-12), invite with 3${SY[rs]}.`, 'D.after-raise');
      }
      return R('P', `Opener's simple raise shows 11-14. With ${p} (10 or less), pass.`, 'D.after-raise');
    }
    if (xl === 3 && rl === 1) {
      if (p >= 10) return R(B(4, rs), `Opener's double raise shows 15-19. With ${p} (10+), bid 4${SY[rs]}.`, 'D.after-double-raise');
      return R('P', `Opener's double raise shows 15-19. With ${p} (6-9), pass.`, 'D.after-double-raise');
    }
    return gap('The chart has no continuation after this raise.');
  }
  if (x === '1N') {
    if (l[rs] >= 5 || p > 15) return gap('After a 1NT rebid, the chart gives no call with a five-card suit or 16+.');
    if (p <= 10) return R('P', `Opener's 1NT shows 12-14 balanced. With ${p} (10 or less), pass.`, 'D.after-1nt');
    if (p <= 12) return R('2N', `Opener's 1NT shows 12-14. With ${p} (11-12), invite with 2NT.`, 'D.after-1nt');
    return R('3N', `Opener's 1NT shows 12-14. With ${p} (13+), bid 3NT.`, 'D.after-1nt');
  }
  if (x === '2N' && rl === 1) {
    if (rs >= 2 && l[rs] >= 5) return gap('After a 2NT rebid, the chart gives no call with a five-card major.');
    if (p >= 7) return R('3N', `Opener's 2NT shows 18-19 balanced. With ${p} (7+), bid 3NT.`, 'D.after-2nt');
    return R('P', `Opener's 2NT shows 18-19. With only ${p}, pass.`, 'D.after-2nt');
  }
  return gap('The chart has no continuation after this rebid.');
}

// ---------- E: 2NT, 2♣, weak twos ----------
// Responder to 2NT (pm = 3), or to 2♣-2♦-2NT (pm = 1). pm is the most HCP that passes.
function over2Nx(h, pm) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (p > 10) return gap('The chart has no call opposite 2NT with 11+.');
  if ((H >= 5 && S >= 4) || (S >= 5 && H >= 4)) return gap('The chart has no call opposite 2NT with 5-4 in the majors.');
  if ((H >= 6 || S >= 6) && p > pm) {
    const M = S >= 6 ? 3 : 2;
    return R(M === 2 ? '4D' : '4H', `${Num(l[M])} ${SN[M]} with enough to play game: Texas ${M === 2 ? '4♦ → 4♥' : '4♥ → 4♠'}.`, 'E.2nt-texas');
  }
  if (H >= 5 || S >= 5) {
    const M = S >= 5 ? 3 : 2;
    if (p > 5) return gap('The chart has no call opposite 2NT for a five-card major with 6+.');
    return R(M === 2 ? '3D' : '3H', `${l[M]} ${SN[M]}: transfer with ${M === 2 ? '3♦' : '3♥'}. ${p <= pm ? `Then pass with 0-${pm}.` : `Then 4${SY[M]}.`}`, 'E.2nt-transfer');
  }
  if (p <= pm) return R('P', `${p} HCP: ${pm === 3 ? '0-3 passes 2NT' : '0-1 passes 2NT here'}.`, 'E.2nt-pass');
  if (H === 4 || S === 4) return R('3C', `${p} HCP with a 4-card major: 3♣ Stayman.`, 'E.2nt-stayman');
  return R('3N', `${p} HCP, no major: 3NT.`, 'E.2nt-game');
}
function over2C(h) {
  const p = hcp(h), l = L(h), bal = isBal(h);
  if (p <= 7) return R('2D', `${p} HCP: 2♦ negative (0-7).`, 'E.2c-negative');
  if (p > 12) return gap('The chart has no response to 2♣ with 13+.');
  const five = l.some(n => n >= 5);
  if (bal && !five) {
    if (l[2] === 4 || l[3] === 4) return amb('Balanced with a four-card major: the chart allows 2NT or the major.');
    if (p <= 9) return R('2N', `Balanced ${p}: 2NT positive (8-9).`, 'E.2c-positive-nt');
    return R('3N', `Balanced ${p}: 3NT positive (10-12).`, 'E.2c-positive-nt');
  }
  const c = [2, 3].filter(s => l[s] >= 4).concat([0, 1].filter(s => l[s] >= 5));
  if (!c.length) return gap('The chart has no positive response to 2♣ for this shape.');
  const mx = Math.max(...c.map(s => l[s])), t = c.filter(s => l[s] === mx);
  if (t.length > 1) return amb('Two suits of equal length: the chart does not say which to show.');
  const s = t[0];
  return s >= 2 ? R(B(2, s), `${p} HCP positive with ${l[s]} ${SN[s]}: 2${SY[s]} (4+ major).`, 'E.2c-positive-suit')
    : R(B(3, s), `${p} HCP positive with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`, 'E.2c-positive-suit');
}
// 2♣ opener's rebid after 2♦.
function twoClubRebid(h) {
  const p = hcp(h), l = L(h), bal = isBal(h);
  if (p > 27) return gap('The chart has no 2♣ rebid for 28+.');
  if (bal) {
    if (l[2] >= 5 || l[3] >= 5) return amb('Balanced with a five-card major: the chart allows no-trump or the major.');
    if (p <= 24) return R('2N', `Balanced ${p}: 2NT shows 23-24.`, 'E.2c-rebid-nt');
    return R('3N', `Balanced ${p}: 3NT shows 25-27.`, 'E.2c-rebid-nt');
  }
  const c = [0, 1, 2, 3].filter(s => l[s] >= 5);
  if (!c.length) return gap('The chart has no 2♣ rebid for a hand without a five-card suit.');
  const mx = Math.max(...c.map(s => l[s])), t = c.filter(s => l[s] === mx);
  if (t.length > 1) return amb('Two five-card suits of equal length: the chart does not say which to bid.');
  const s = t[0];
  return s >= 2 ? R(B(2, s), `Unbalanced with ${l[s]} ${SN[s]}: 2${SY[s]} (5+ suit).`, 'E.2c-rebid-suit')
    : R(B(3, s), `Unbalanced with ${l[s]} ${SN[s]}: 3${SY[s]} (5+ minor).`, 'E.2c-rebid-suit');
}
// Responder to a weak two in M.
function wtResp(h, M) {
  const p = hcp(h), t = L(h)[M];
  if (p >= 14) {
    if (t >= 4) return amb('With 14+ and four trumps, the chart allows 2NT or game.');
    return R('2N', `${p} HCP: 2NT asks (14+). Opener shows a feature or a minimum.`, 'E.weak-two-ask');
  }
  if (t >= 4) return R(B(4, M), `${t} trumps: raise to 4${SY[M]}.`, 'E.weak-two-raise');
  if (t === 3) return R(B(3, M), `3 trumps: raise to 3${SY[M]}.`, 'E.weak-two-raise');
  return R('P', `${t} ${SN[M]} and under 14 HCP: pass.`, 'E.weak-two-pass');
}
// Weak-two opener answers the 2NT ask.
function wtAns(h, M) {
  const p = hcp(h);
  if (has(h, M, 14) && has(h, M, 13) && has(h, M, 12)) return R('3N', `Solid AKQ in ${SN[M]}: 3NT.`, 'E.weak-two-answer');
  const f = [0, 1, 2, 3].filter(s => s !== M && (has(h, s, 14) || has(h, s, 13)));
  if (p <= 7) return R(B(3, M), `${p} HCP is a minimum (5-7): 3${SY[M]}.`, 'E.weak-two-answer');
  if (!f.length) return R(B(3, M), `${p} HCP but no outside ace or king: 3${SY[M]} (no feature).`, 'E.weak-two-answer');
  if (f.length > 1) return amb('More than one outside feature to show.');
  const s = f[0];
  return R(B(3, s), `${p} HCP (8-10) with an outside ${has(h, s, 14) ? 'ace' : 'king'} in ${SN[s]}: show the feature with 3${SY[s]}.`, 'E.weak-two-answer');
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
    if (!two) return gap('A 5-5 hand with 11-15 is outside the Michaels and Unusual 2NT ranges.');
    if (mich) return R(B(2, x), `5-5 with ${x <= 1 ? 'both majors' : `${SN[om]} and a minor`} and ${p} HCP (6-10 or 16+): Michaels cue bid 2${SY[x]}.`, 'F.michaels');
    return R('2N', `5-5 in the two lowest unbid suits (${SN[low[0]]} and ${SN[low[1]]}), ${p} HCP: Unusual 2NT.`, 'F.unusual-2nt');
  }
  if (five.length >= 2) return gap('The chart has no overcall for this two-suiter.');
  if (bal && p >= 15 && p <= 18) {
    if (stop(h, x)) return R('1N', `${p} HCP balanced with a ${SN[x]} stopper: 1NT overcall (15-18).`, 'F.1nt-overcall');
    return gap('Balanced 15-18 without a stopper: the chart gives no call.');
  }
  if (p >= 12 && five.length === 0 && un.every(s => l[s] >= 3)) return R('X', `${p} HCP with 3+ cards in every unbid suit: takeout double.`, 'F.takeout-double');
  if (five.length === 1) {
    const s = five[0], n = l[s], lv = s > x ? 1 : 2;
    if (lv === 1) {
      if (n >= 6 && p >= 6 && p <= 7) return R(B(2, s), `${Num(n)} ${SN[s]} and ${p} HCP: weak jump overcall 2${SY[s]} (6+ suit, 6-10).`, 'F.weak-jump-overcall');
      if (n >= 6 && p >= 8 && p <= 10) return amb('A six-card suit with 8-10 could make a simple or a jump overcall.');
      if (p >= 8 && p <= 15 && good(h, s)) return R(B(1, s), `${n} good ${SN[s]} and ${p} HCP: 1${SY[s]} overcall (5+ good suit, 8+).`, 'F.overcall');
      return gap('The chart has no overcall for this hand.');
    }
    if (n >= 6 && p >= 6 && p <= 9) return R(B(3, s), `${Num(n)} ${SN[s]} and ${p} HCP: weak jump overcall 3${SY[s]} (6+ suit, 6-10).`, 'F.weak-jump-overcall');
    if (n >= 6 && p >= 11 && p <= 15 && good(h, s)) return R(B(2, s), `${Num(n)} good ${SN[s]}, ${p} HCP: 2-level overcall 2${SY[s]} (6+ suit, 10+).`, 'F.overcall');
    return gap('The chart has no overcall for this hand.');
  }
  if (p <= 9) return R('P', `${p} HCP with no 5-card suit of your own and not enough to double: pass.`, 'F.overcall-pass');
  return gap('The chart has no call for this hand over the opening.');
}
// Partner opened 1 of suit o, RHO overcalled 1 of suit v.
function negDbl(h, o, v) {
  const p = hcp(h), l = L(h);
  let need, show;
  if (o === 0 && v === 1) { need = l[2] === 4 && l[3] === 4; show = '4-4 in the majors'; }
  else if (o <= 1 && v === 2) { need = l[3] === 4; show = 'four spades'; }
  else if (o <= 1 && v === 3) { need = l[2] === 4; show = 'four hearts'; }
  else { need = l[0] >= 4 && l[1] >= 4; show = 'both minors'; }
  if (need && p >= 6) return R('X', `Negative double: shows ${show} and 6+ (the overcall was at the 1-level).`, 'F.negative-double');
  if (p <= 5) return R('P', `Only ${p} HCP: a negative double over a 1-level overcall needs 6+. Pass.`, 'F.negative-double-pass');
  return gap('The chart only covers the negative double here.');
}
// LHO opened 1 of suit x, partner doubled for takeout, RHO passed.
function advance(h, x) {
  const p = hcp(h), l = L(h), un = [0, 1, 2, 3].filter(s => s !== x);
  const mx = Math.max(...un.map(s => l[s])), longs = un.filter(s => l[s] === mx);
  if (longs.length > 1) return amb('Two longest suits of equal length: the chart does not say which to bid.');
  if (p > 15) return gap('The chart has no advance with 16+.');
  const s = longs[0], lv = s > x ? 1 : 2;
  if (p <= 8) return R(B(lv, s), `${p} HCP (0-8): bid your longest suit at the lowest level, ${plain(B(lv, s))}. Never pass a takeout double.`, 'F.advance-min');
  if (p <= 11) return R(B(lv + 1, s), `${p} HCP (9-11): jump in your longest suit, ${plain(B(lv + 1, s))}.`, 'F.advance-jump');
  const g = s >= 2 ? B(4, s) : B(5, s);
  return R(g, `${p} HCP (12+): bid game in your longest suit, ${plain(g)}.`, 'F.advance-game');
}
// RHO opened a strong 1NT; we play Cappelletti.
function vs1NT(h) {
  const p = hcp(h), l = L(h), [C, D, H, S] = l;
  if (p < 8) return R('P', `${p} HCP: Cappelletti actions need 8+. Pass.`, 'F.cappelletti-pass');
  if (p >= 16) {
    if (isBal(h)) return R('X', `${p} HCP balanced: double is penalty (16+).`, 'F.penalty-double');
    return gap('The chart has no call over 1NT for an unbalanced hand with 16+.');
  }
  if (H >= 4 && S >= 4 && (H >= 5 || S >= 5)) return R('2D', `${H} hearts and ${S} spades: 2♦ shows both majors.`, 'F.cappelletti-2d');
  if (H >= 5 && S <= 3 && (C >= 4 || D >= 4)) return R('2H', `Hearts plus a 4+ minor: 2♥ (hearts and a minor).`, 'F.cappelletti-2h');
  if (S >= 5 && H <= 3 && (C >= 4 || D >= 4)) return R('2S', `Spades plus a 4+ minor: 2♠ (spades and a minor).`, 'F.cappelletti-2s');
  if (C >= 5 && D >= 5) return R('2N', `5-5 in the minors: 2NT.`, 'F.cappelletti-2nt');
  const six = [0, 1, 2, 3].filter(s => l[s] >= 6);
  if (six.length === 1 && l.filter(n => n >= 4).length === 1) return R('2C', `One long suit (${l[six[0]]} ${SN[six[0]]}): 2♣ shows any one-suiter. Partner relays 2♦${six[0] === 1 ? ' and you pass' : ` and you bid ${SN[six[0]]}`}.`, 'F.cappelletti-2c');
  if (isBal(h)) return R('P', `Balanced ${p} HCP with no two-suiter: pass. Double needs 16+.`, 'F.cappelletti-pass');
  return gap('The chart has no Cappelletti call for this shape.');
}

// ---------- G: Roman Key Card Blackwood (5♣ = 0 or 3, 5♦ = 1 or 4) ----------
// Key cards are the four aces and the trump king.
const kcList = (h, M) => [0, 1, 2, 3].filter(s => has(h, s, 14)).map(s => cardName(s, 14)).concat(has(h, M, 13) ? [cardName(M, 13)] : []);
// Answer partner's 4NT.
function rkReply(h, M) {
  const k = kcList(h, M), n = k.length, q = has(h, M, 12);
  const list = n ? `Key cards: ${k.join(', ')} = ${n}.` : 'No key cards.';
  if (n === 0 || n === 3) return R('5C', `${list} 5♣ shows 0 or 3.`, 'G.rkcb-answer');
  if (n === 1 || n === 4) return R('5D', `${list} 5♦ shows 1 or 4.`, 'G.rkcb-answer');
  if (n === 2) return q ? R('5S', `${list} You hold the ${SY[M]}Q: 5♠ = 2 with the queen.`, 'G.rkcb-answer') : R('5H', `${list} No trump queen: 5♥ = 2 without the queen.`, 'G.rkcb-answer');
  return gap('The chart has no reply showing all five key cards.');
}
// The 4NT bidder decides after partner's reply.
function askDecide(h, M, reply) {
  const k = kcList(h, M).length;
  let poss = reply === '5C' ? [0, 3] : reply === '5D' ? [1, 4] : [2];
  poss = poss.filter(v => v + k <= 5);
  if (poss.length !== 1) return amb('The reply could mean two different numbers of key cards.');
  const pk = poss[0], tot = k + pk, miss = 5 - tot, rv = bv(reply), five = bv(B(5, M));
  const head = `You hold ${k}, partner's ${plain(reply)} shows ${reply === '5C' ? '0 or 3' : reply === '5D' ? '1 or 4' : '2'} so ${pk} here: ${tot} of 5.`;
  if (miss >= 2) {
    if (rv < five) return R(B(5, M), `${head} Missing two: sign off in 5${SY[M]}.`, 'G.rkcb-decide');
    if (rv === five) return R('P', `${head} Missing two, and partner's reply is already 5${SY[M]}: pass.`, 'G.rkcb-decide');
    return gap('Missing two key cards, but the reply is already above five of the trump suit.');
  }
  if (miss === 1) return R(B(6, M), `${head} Missing one: bid 6${SY[M]}.`, 'G.rkcb-decide');
  return R('5N', `${head} All five key cards: 5NT asks for kings.`, 'G.rkcb-decide');
}
