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
// E 2NT / 2♣ / weak twos / pre-empts, G slam tools, LTC losing trick count.
// F (competitive) and H (support doubles, cue bids, Helvic) are in competitive.js.
// GUIDE marks a trainer agreement where the chart is silent ('GUIDE.invite-answer').
//
// The chart itself is docs/5CM_SNT_Bidding_Flowchart_A3.pdf.
'use strict';

// ---------- Opening bids ----------
function minorOpen(l) { return l[0] > l[1] ? '1C' : l[1] > l[0] ? '1D' : (l[0] >= 4 ? '1D' : '1C'); }
function minorWhy(l) {
  return l[0] > l[1] ? 'Clubs are the longer minor: 1♣.'
    : l[1] > l[0] ? 'Diamonds are the longer minor: 1♦.'
    : l[0] >= 5 ? '5-5 in the minors: open the higher-ranking suit, 1♦.'
    : l[0] >= 4 ? '4-4 in the minors opens 1♦.' : '3-3 in the minors opens 1♣.';
}
function openingBid(h) {
  if (SYS.acol) return acolOpening(h);
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
      const M = l[3] >= l[2] ? 3 : 2, mn = Math.max(l[0], l[1]);
      // Longest suit first: a longer minor (6-5) opens the minor; you bid the major twice later.
      if (mn > l[M]) { const m = l[1] >= l[0] ? 1 : 0; return R(B(1, m), `${p} HCP with ${NUM[l[m]]} ${SN[m]} and five ${SN[M]}: open your longest suit, 1${SY[m]}. Bid the ${SN[M].replace(/s$/, '')}s twice later to show five.`, 'OB.longer-minor'); }
      const why = l[2] === l[3] ? 'With 5-5 in the majors, open the higher-ranking suit: 1♠.'
        : mn === l[M] ? 'With 5-5, open the higher-ranking suit.'
        : 'Open the longer major.';
      return R(B(1, M), `${p} HCP, unbalanced, with a 5+ card major: open 1${SY[M]}. ${why}`, 'OB.major');
    }
    return R(minorOpen(l),`${p} HCP, unbalanced, no 5-card major: open a minor. ${minorWhy(l)}`, 'OB.minor');
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
// Opener answers transfer-then-2NT (five cards in M, 8-9) holding 3+ cards in M: play the 5-3 fit.
function invFit(h, M) {
  const p = hcp(h), t = L(h)[M];
  return p <= 15 ? R(B(3, M), `Partner showed five ${SN[M]} and 8-9. With ${t} ${SN[M]} you have a fit, and ${p} HCP is a minimum (15): bid 3${SY[M]}. A 5-3 fit usually takes a trick more than no-trumps.`, 'A.invite-answer')
    : R(B(4, M), `Partner showed five ${SN[M]} and 8-9. With ${t} ${SN[M]} you have a fit, and ${p} HCP is a maximum (16-17): bid 4${SY[M]}.`, 'A.invite-answer');
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
    if (p <= 5 && !shapeResp(h)) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
    // Shape counts: 7 losers or fewer plays like 13+ (game opposite an opener's 7 losers).
    const k = losers(h), gf = p >= 13 || (p >= 7 && k <= 7);
    if (gf) {
      const why = p >= 13 ? `${p} HCP` : `${p} HCP but only ${k} losers (${loserBreak(h)}), so your hand plays like 13+`;
      // A good side suit (5+ cards, two of the top three honours) is shown first: it's your source of tricks.
      const side = [0, 1, 2, 3].filter(s => s !== M && l[s] >= 5 && [14, 13, 12].filter(r => has(h, s, r)).length >= 2).sort((a, b) => l[b] - l[a] || b - a);
      if (side.length) {
        const s = side[0], b = B(s > M ? 1 : 2, s);
        return R(b, `${t}-card support and ${why}. With a good ${l[s]}-card ${SN[s].replace(/s$/, '')} suit, show it first (${plain(b)}, forcing), then support ${SN[M]} strongly: partner learns where your tricks come from.`, 'B.new-suit-then-support');
      }
      // Splinter: game values up to 15 with a singleton (not the A or K) or a void: a double jump in the short suit.
      const sp = splinterSuit(h, M);
      if (sp !== undefined && p <= 15) {
        const b = splinterBid(M, sp);
        return R(b, `${t}-card support and ${why}, with ${l[sp] ? 'a singleton' : 'a void'} in ${SN[sp]}: splinter, ${plain(b)} (a double jump). It shows 4+ trumps, game values (up to 15) and shortness in ${SN[sp]}, so partner can judge whether his values fit: honours opposite your shortness are wasted.`, 'B.splinter');
      }
      return R('2N', `${t}-card support and ${why}: Jacoby 2NT (4+ trumps, game forcing).`, 'B.jacoby');
    }
    if (p <= 6) return R(B(2, M), `${p <= 5 ? shapeWhy(h) : ''}${t}-card support and ${p} HCP: simple raise to 2${SY[M]} (6-9). 3♦ needs 7+.`, 'B.raise');
    if (p <= 9) return R('3D', `${t}-card support and ${p} HCP: 3♦ shows 4+ trumps, 7-9.`, 'B.bergen-3d');
    if (p <= 12) return R('3C', `${t}-card support and ${p} HCP: 3♣ shows 4+ trumps, 10-12.`, 'B.bergen-3c');
    return R('2N', `${t}-card support and ${p} HCP: Jacoby 2NT (4+ trumps, 13+, game forcing).`, 'B.jacoby');
  }
  if (t === 3) {
    if (p <= 5 && !shapeResp(h)) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
    if (p <= 9) return R(B(2, M), `${p <= 5 ? shapeWhy(h) : ''}3-card support, ${p} HCP: simple raise to 2${SY[M]} (6-9).`, 'B.raise');
    if (p <= 12) return R(B(3, M), `3-card support, ${p} HCP: limit raise to 3${SY[M]} (10-12).`, 'B.limit-raise');
    if (p <= 15 && isBal(h)) return R('3N', `3-card support, ${p} HCP, balanced: 3NT (13-15, exactly three ${SN[M]}). Partner chooses: pass with a flat 5-3-3-2, otherwise 4${SY[M]}.`, 'B.3nt-raise');
    const n = newSuitM(h, M);
    return R(n, `3-card support with ${p} HCP: bid a new suit first (${plain(n)}, forcing), then support. It leaves room for slam.`, 'B.new-suit-then-support');
  }
  if (p <= 5 && !shapeResp(h)) return R('P', `${p} HCP is too weak to respond. Pass.`, 'B.pass');
  const sw = p <= 5 ? shapeWhy(h) : '';
  if (M === 2 && l[3] >= 4) return R('1S', `${sw}Fewer than 3 hearts and ${l[3]} spades: 1♠ (4+ spades, 6+, forcing).`, 'B.one-spade');
  if (SYS.twoOne) {   // 2/1 game forcing: 1NT is forcing (6-12); a new suit at the 2-level is game forcing (13+)
    if (p <= 12) return R('1N', `${sw}Fewer than 3 ${SN[M]} and ${p} HCP: 1NT, forcing for one round (6-12). In 2/1 a new suit at the 2-level would be game forcing, so with ${p} you start with 1NT and show a long suit next.`, 'B.21-1nt-forcing');
    const n = newSuitM(h, M);
    return R(n, `Fewer than 3 ${SN[M]} and ${p} HCP (13+): ${plain(n)}, a 2-over-1. It forces to game, so neither of you can stop below game; now you can both bid naturally and slowly.`, 'B.21-gf');
  }
  if (p <= 8) return R('1N', `${sw}Fewer than 3 ${SN[M]} and ${p} HCP: 1NT (6-10, any shape, not forcing).`, 'B.1nt');
  if (p <= 10) return amb('With 9-10 and fewer than three trumps, the chart allows 1NT or a new suit.');
  const n = newSuitM(h, M);
  return R(n, `Fewer than 3 ${SN[M]} and ${p} HCP: new suit at the 2-level (9+, forcing). Bid the longest; with equal length, the lower.`, 'B.new-suit');
}
// Splinters: 1♥ – 3♠/4♣/4♦, 1♠ – 4♣/4♦/4♥ (a double jump) = 4+ trumps, game values up to 15,
// singleton (not the A or K) or void in the suit bid.
function splinterSuit(h, M) {
  const l = L(h), sh = [0, 1, 2, 3].filter(s => s !== M && (l[s] === 0 || (l[s] === 1 && !has(h, s, 14) && !has(h, s, 13))));
  return sh.length === 1 ? sh[0] : sh.find(s => l[s] === 0);
}
const splinterBid = (M, s) => B(M === 2 && s === 3 ? 3 : 4, s);
const isSplinter = (r, M) => [0, 1, 2, 3].some(s => s !== M && r === splinterBid(M, s));
// Opener after a splinter: count the points that work (K, Q, J opposite the shortness are wasted).
function splinterAns(h, M, r) {
  const p = hcp(h), ss = ST.indexOf(r[1]), l = L(h);
  const wasted = [[13, 3], [12, 2], [11, 1]].filter(([c]) => has(h, ss, c)).reduce((a, [, v]) => a + v, 0), work = p - wasted;
  const k = losers(h);
  const head = `Partner's ${plain(r)} is a splinter: 4+ ${SN[M]}, game values and ${SN[ss].replace(/s$/, '')} shortness.`;
  const pts = `${p} HCP${wasted ? `, but ${wasted} of them (${[13, 12, 11].filter(c => has(h, ss, c)).map(c => cardName(ss, c)).join(' ')}) are wasted opposite the shortness` : ', none wasted opposite the shortness'}`;
  const slam = work >= 17 || 24 - k - 7 >= 12;
  if (!slam) return R(B(4, M), `${head} You have ${pts}, so ${work} working points and ${k} losers: not enough for slam (you want about 17 working points). Sign off in 4${SY[M]}.`, 'B.splinter-answer');
  const side = [0, 1, 2, 3].filter(s => s !== M && s !== ss);
  const hole = side.filter(s => !firstCtl(h, s) && !secondCtl(h, s)), voids = side.filter(s => l[s] === 0);
  const why = `${head} You have ${pts}: ${work} working points${24 - k - 7 >= 12 ? ` and ${k} losers (partner about 7: 24 − ${k + 7} = ${17 - k} tricks)` : ''}, so slam is possible.`;
  if (!hole.length && !voids.length && kcList(h, M).length >= 2) return R('4N', `${why} Every suit is controlled: ask for key cards with 4NT (RKCB).`, 'B.splinter-answer');
  const c = cheapestCue(h, M, r);
  if (c) return R(c[1], `${why} ${hole.length ? `But ${hole.map(s => SN[s]).join(' and ')} may be wide open` : voids.length ? 'With a void, RKCB is unreliable' : "With fewer than 2 key cards, don't ask"}: make a control bid, ${plain(c[1])}, your cheapest ace or void. Partner shows his cheapest ace or void, or signs off in 4${SY[M]}.`, 'G.cue-bid');
  return R(B(4, M), `${why} But you have no ace or void to show below 4${SY[M]}, and a suit may be open: sign off in 4${SY[M]}.`, 'B.splinter-answer');
}
// Opener answers Jacoby 2NT.
function jac(h, M) {
  const p = hcp(h), l = L(h);
  const short = [0, 1, 2, 3].filter(s => s !== M && l[s] <= 1);
  const g5 = [0, 1, 2, 3].filter(s => s !== M && l[s] >= 5 && [14, 13, 12].filter(r => has(h, s, r)).length >= 2);
  // A good 5-card side suit comes first (a 5-5 hand always has a short suit too).
  if (g5.length > 1 || (!g5.length && short.length > 1)) return amb('Opener has more than one feature to show over Jacoby 2NT.');
  if (short.length && !g5.length) {
    const s = short[0];
    return R(B(3, s), `${l[s] === 0 ? 'Void' : 'Singleton'} in ${SN[s]}: show it with 3${SY[s]}.`, 'B.jacoby-shortness');
  }
  if (g5.length) {
    const s = g5[0];
    if (M === 2 && s === 3) return gap('The chart has no way to show a good spade suit over 1♥ – 2NT.');
    return R(B(4, s), `Good 5-card ${SN[s]} suit: 4${SY[s]}.${short.length ? ' A good side suit comes before showing your short suit.' : ''}`, 'B.jacoby-side-suit');
  }
  if (p <= 14) return R(B(4, M), `Flat minimum (${p}): 4${SY[M]} shows 11-14 with no shortness.`, 'B.jacoby-flat');
  if (p <= 17) return R('3N', `Flat ${p}: 3NT shows 15-17 with no shortness.`, 'B.jacoby-flat');
  return R(B(3, M), `Flat ${p}: 3${SY[M]} shows 18+ with no shortness.`, 'B.jacoby-flat');
}
// Jacoby responder after opener's flat answer x: settle or ask for key cards.
function jacCont(h, M, x) {
  const p = hcp(h);
  const [cm, cl] = x === B(4, M) ? [11, 7] : x === '3N' ? [15, 6] : x === B(3, M) ? [18, 5] : [11, 6];
  const cue = cueStart(h, M, x, cm, cl, `Opener's ${plain(x)}`);
  if (cue) return cue;
  if (x === B(4, M)) {
    if (p <= 16) return R('P', `Opener's 4${SY[M]} shows a flat 11-14. With ${p} you have at most ${p + 14} combined: pass.`, 'B.jacoby-signoff');
    if (p >= 20) {
      const s = slamTry(h, M, 11, `Opener's 4${SY[M]} (flat 11-14)`);
      return s.bid === '4N' ? s : R('P', s.why.replace(/bid game, .*$/, 'stay in game: pass.'), 'G.slam-game');
    }
    return gap('With 17-19 opposite a minimum, the chart gives neither a pass nor RKCB.');
  }
  if (x === '3N') {
    if (p <= 13) return R(B(4, M), `Opener's 3NT shows a flat 15-17. With ${p}, settle for 4${SY[M]}.`, 'B.jacoby-signoff');
    if (p >= 16) return slamTry(h, M, 15, "Opener's 3NT (flat 15-17)");
    return gap('With 14-15 opposite 15-17, the chart gives neither game nor RKCB.');
  }
  // Opener with 18+ and 2+ key cards bids 4NT at once, so 3M is 18+ with 0-1 key cards.
  if (x === B(3, M)) return slamTry(h, M, 18, `Opener's 3${SY[M]} (flat 18+)`);
  // Opener showed shortness or a good side suit (11+): slam with 31+ (chart G), else sign off.
  const what = /^4/.test(x) ? 'a good side suit' : 'a short suit';
  return slamTry(h, M, 11, `Opener's ${plain(x)} (${what}, 11+)`) || R(B(4, M), `Opener's ${plain(x)} shows ${what}. With ${p} there's no slam (under 31 between you): sign off in 4${SY[M]}.`, 'B.jacoby-signoff');
}
// Opener with 13-14 after a limit raise: the chart says use LTC (G). A limit raise counts as 8 losers.
function ltcLimit(h, M) {
  const k = losers(h), t = 24 - (k + 8);
  const head = `13-14 after a limit raise: use LTC. Your losers: ${loserBreak(h)} = ${k}. A limit raise counts as 8. 24 − (${k} + 8) = ${t} tricks`;
  if (t >= 12) {   // the 6-level: the slam rule (G) applies
    const kc = kcList(h, M).length;
    return kc >= 2 ? R('4N', `${head}: slam. With ${kc} key cards, ask with 4NT (RKCB).`, 'LTC.limit-raise')
      : R(B(4, M), `${head}: slam is possible, but you hold only ${kc} key card${kc === 1 ? '' : 's'}, so don't ask: bid 4${SY[M]}.`, 'LTC.limit-raise');
  }
  return t >= 10 ? R(B(4, M), `${head}, so bid 4${SY[M]}.`, 'LTC.limit-raise') : R('P', `${head}, so pass 3${SY[M]}.`, 'LTC.limit-raise');
}

// ---------- C: responses to 1♣/1♦ ----------
// Shape counts for responding: 4-5 HCP with 9 losers or fewer plays like a 6-count.
const shapeResp = h => { const p = hcp(h); return p >= 4 && p <= 5 && losers(h) <= 9; };
const shapeWhy = h => `${hcp(h)} HCP, but only ${losers(h)} losers (${loserBreak(h)}): with that shape the hand is worth a response, so treat it as 6. `;
function r1m(h, m) {
  const p = hcp(h), l = L(h), bal = isBal(h), maj = l[2] >= 4 || l[3] >= 4;
  if (p <= 5 && !shapeResp(h)) return R('P', `${p} HCP: a response needs 6+ (or 4-5 with 9 losers or fewer). Pass.`, 'C.pass');
  let pre = p <= 5 ? shapeWhy(h) : '';
  if (bal && !maj) {
    if (p <= 10) return R('1N', `${p} HCP balanced with no 4-card major: 1NT (6-10).`, 'C.1nt');
    if (p <= 12) return R('2N', `${p} HCP balanced with no major: 2NT (11-12).`, 'C.2nt');
    if (p <= 15) return R('3N', `${p} HCP balanced with no major: 3NT (13-15).`, 'C.3nt');
    pre = `With 16+ balanced, bid a new suit first, then 4NT quantitative. `;
  }
  const c = [0, 1, 2, 3].filter(s => s !== m);
  let b = c[0];
  for (const s of c) if (l[s] > l[b]) b = s;
  // Two 5-card suits: bid the higher-ranking first (so a 5-card major comes before diamonds).
  const ties5 = c.filter(s => l[s] === l[b] && l[s] >= 5);
  if (ties5.length > 1) b = ties5[ties5.length - 1];
  if (l[m] > l[b]) return gap('The longest suit is the opening minor, and the chart has no minor raises.');
  // Over 1♣ with four diamonds and a 4-card major, show the major first (chart C).
  if (m === 0 && b === 1 && l[1] === 4) {
    const mj = [2, 3].find(s => l[s] === 4);
    if (mj !== undefined) {
      const bd = B(1, mj);
      return R(bd, `${pre}${pre ? '' : `${p} HCP: `}four diamonds and four ${SN[mj]}: over 1♣, show the major first, ${plain(bd)}, so a major-suit fit isn't lost. 1-level needs 6+; forcing.`, 'C.major-first');
    }
  }
  // A 4-card major at the 1-level comes before a 4-card minor (4-4: never skip the major; up the line, ♥ first).
  if (l[b] === 4 && b < 2) {
    const mj = [2, 3].find(s => l[s] === 4);
    if (mj !== undefined) {
      const bd = B(1, mj);
      return R(bd, `${pre}${pre ? '' : `${p} HCP: `}four ${SN[b]} and four ${SN[mj]}: show the major first, ${plain(bd)}, so a major-suit fit isn't lost. The ${SN[b].replace(/s$/, '')} suit can wait; 1-level needs 6+; forcing.`, 'C.major-first');
    }
  }
  const lv = b > m ? 1 : 2;
  if (SYS.twoOne && lv === 2) {
    if (p >= 13) return R(B(2, b), `${pre}${p} HCP with ${NUM[l[b]]} ${SN[b]}: 2${SY[b]}, a 2-over-1, game forcing (13+).`, 'B.21-gf');
    return R('1N', `${pre}${p} HCP: in 2/1, 2${SY[b]} would be game forcing (13+), so bid 1NT (6-10; with an unbalanced 11-12 it's the nearest bid).`, 'B.21-1nt-forcing');
  }
  if (lv === 2 && p < 9) return gap('The longest suit could only be bid at the 2-level, which needs 9+.');
  const tie = c.filter(s => l[s] === l[b]).length > 1;
  const tieWhy = !tie ? '' : l[b] >= 5 ? ' (two 5-card suits: bid the higher-ranking first)' : ' (equal length: bid the lower, up the line)';
  return R(B(lv, b), `${pre}${pre ? '' : `${p} HCP: `}new suit, longest first${tieWhy}: ${plain(B(lv, b))}. ${lv === 1 ? '1-level needs 6+' : '2-level needs 9+'}; forcing.`, 'C.new-suit');
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
    // Shape upgrade: a 7-card suit plays like 15-19, so jump rebid.
    // Losers only count once a fit is known, so no jump on the loser count here; a seven-card suit is length, not losers.
    // In 2/1, after a 2-over-1 game is forced: no jump rebids at all.
    const gf21 = SYS.twoOne && lvl === 2;
    const jumpByShape = l[o] >= 7 && !gf21;
    const shapeJump = () => R(B(3, o), `${p} HCP, but a ${NUM[l[o]]}-card suit plays like the strong band (15-19): jump rebid to 3${SY[o]}.`, 'D.jump-rebid-shape');
    if (jumpByShape) return shapeJump();
    // 6-4 with a 4-card major you can show below the barrier: show the major first. A major
    // fit is worth more than repeating the long suit, and you can rebid that suit later.
    const mj = others.filter(s => s >= 2 && l[s] >= 4 && bv(B(cheapest(s, resp), s)) < bv(bar));
    if (l[o] >= 6 && mj.length === 1) {
      const s = mj[0], b = B(cheapest(s, resp), s);
      return R(b, `Unbalanced 11-14 with ${NUM[l[o]]} ${SN[o]} and four ${SN[s]}: show the major first, ${plain(b)}, so a 4-4 ${SN[s].replace(/s$/, '')} fit isn't lost. It sits below the barrier (2${SY[o]}), so it shows no extra strength, and you can still rebid your ${SN[o]} later.`, 'D.new-suit');
    }
    // 6-5: show the five-card second suit first (below the barrier), and rebid the long suit next time.
    const five = others.filter(s => l[s] >= 5 && (gf21 || bv(B(cheapest(s, resp), s)) < bv(bar))).sort((a, b) => b - a)[0];
    if (l[o] >= 6 && five !== undefined) { const b = B(cheapest(five, resp), five); return R(b, `${p} HCP, ${NUM[l[o]]} ${SN[o]} and five ${SN[five]}: 6-5, come alive. Show the second suit now, ${plain(b)} (${gf21 && bv(b) > bv(bar) ? 'game is already forced, so there is no barrier' : 'below the barrier'}, no extra strength promised), and rebid your ${SN[o]} next time, so partner knows you're 6-5.`, 'D.new-suit'); }
    if (jumpByShape) return shapeJump();
    if (l[o] >= 6) return R(B(2, o), `Unbalanced 11-14 with ${NUM[l[o]]} ${SN[o]}: simple rebid of 2${SY[o]}.${others.some(s => s >= 2 && l[s] >= 4) ? ' Your 4-card major would be a reverse here (above the barrier, 16+), so rebid the long suit.' : ''}`, 'D.rebid-suit');
    // 2/1 after a 2-over-1: game is forced, so there is no barrier. Describe the hand: a four-card
    // second suit at the cheapest level, else a raise of partner's minor with three, before rebidding a five-card major.
    if (gf21) {
      const side = others.filter(s => l[s] >= 4);
      if (side.length > 1) return amb('More than one four-card suit to show.');
      if (side.length === 1) { const s = side[0], b = B(cheapest(s, resp), s); return R(b, `Game is forced by the 2-over-1, so there is no barrier: a new suit shows shape, not extra strength. Show your ${NUM[l[s]]} ${SN[s]}: ${plain(b)}. You can support partner or rebid your ${SN[o]} next.`, 'D.21-describe'); }
      if (o >= 2 && r < 2 && l[r] >= 3) { const b = B(3, r); return R(b, `Game is forced by the 2-over-1. With ${l[r]} ${SN[r]} you have a fit: show it now, ${plain(b)}. Rebidding 2${SY[o]} would say "nothing else to show", which isn't true.`, 'D.21-describe'); }
    }
    const below = others.filter(s => l[s] >= 4 && bv(B(cheapest(s, resp), s)) <= bv(bar));
    if (below.length > 1) return amb('More than one four-card suit could be shown below the barrier.');
    if (below.length === 1) {
      const s = below[0], b = B(cheapest(s, resp), s);
      return R(b, `Unbalanced 11-14: show the 4-card ${SN[s]} suit with ${plain(b)}. It sits below the barrier (2${SY[o]}), so it shows no extra strength.`, 'D.new-suit');
    }
    if (l[o] >= 5) return R(B(2, o), `Unbalanced 11-14 with nothing else to show: simple rebid of your 5-card suit, 2${SY[o]}.`, 'D.rebid-suit');
    return gap('The chart has no minimum rebid for this hand.');
  }
  // After a 2-level response (10+) the hand is in the game zone: show the shape, everything is forcing.
  if (lvl !== 1 && p <= 19) {
    if (l[r] >= 4) return R(B(3, r), `${p} HCP with ${l[r]} ${SN[r]}: raise to 3${SY[r]}. After a 2-level response this is forcing (game values between you).`, 'D.double-raise');
    if (l[o] >= 6 && SYS.twoOne) return R(B(cheapest(o, resp), o), `${p} HCP with ${NUM[l[o]]} ${SN[o]}. Game is already forced by the 2-over-1, so there is no need to jump: rebid ${plain(B(cheapest(o, resp), o))} and show the extras later.`, 'D.rebid-suit');
    if (l[o] >= 6) return R(B(3, o), `${p} HCP with ${NUM[l[o]]} ${SN[o]}: jump rebid to 3${SY[o]}, forcing after a 2-level response.`, 'D.jump-rebid');
    const s2 = others.filter(s => l[s] >= 4).sort((a, b) => l[b] - l[a] || b - a)[0];
    if (s2 !== undefined) { const b = B(cheapest(s2, resp), s2); return R(b, `${p} HCP: show your second suit, ${plain(b)}. After a 2-level response a new suit is forcing, so no need to jump.`, bv(b) > bv(bar) ? 'D.reverse' : 'D.six-five'); }
    return R(B(cheapest(o, resp), o), `${p} HCP with nothing else to show: rebid ${SN[o]}, ${plain(B(cheapest(o, resp), o))}.`, 'D.rebid-suit');
  }
  if (lvl !== 1 && p <= 22) return gap('The chart has no rebid with 20+ after a 2-level response.');
  if (p <= 19) {
    if (l[r] >= 4) return R(B(3, r), `Unbalanced 15-19 with ${l[r]} ${SN[r]}: double raise to 3${SY[r]}.`, 'D.double-raise');
    // 6-5 with a five-card major (opened the longer minor): show the major now, and again later.
    const five = others.filter(s => s >= 2 && l[s] >= 5);
    if (o <= 1 && l[o] >= 6 && five.length === 1) {
      const s = five[0], b = B(cheapest(s, resp), s);
      return R(b, `${p} HCP, six ${SN[o]} and five ${SN[s]}: show the major now with ${plain(b)}${bv(b) > bv(bar) ? ' (a reverse, fine with 15-19)' : ''}. Bid ${SN[s]} again next time to show five.`, 'D.six-five');
    }
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
  // Opener's jump rebid in the major (15-19, six cards): a fit is known, so chart D ("10+ game")
  // and chart G (31+ with a fit asks 4NT) decide.
  if (x === B(3, M) && r[0] === '1') return slamTry(h, M, 15, `Opener's jump to ${plain(x)} (15-19)`) || R(B(4, M), `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[M]}. With three-card support and ${p}, bid game: 4${SY[M]}.`, 'D.after-jump-rebid');
  if (!minimum) {   // opener showed extras: 18-19 balanced (2NT, or 3NT after a 2-level response) or 15-19
    const mn = x === '3N' || x === '2N' ? 18 : 15;
    return slamTry(h, M, mn, `Opener's ${plain(x)} (${mn}+)`) || R(B(4, M), `Opener's ${plain(x)} shows ${mn}+. You have ${NUM[L(h)[M]]}-card support: now bid game, 4${SY[M]}.`, 'B.support-after-new-suit');
  }
  // As after Jacoby: at most 16 + 14 = 30 combined, so no slam.
  if (p >= 17) return slamTry(h, M, 11, "Opener's minimum rebid (11-14)") || R(B(4, M), `Opener's rebid shows a minimum. With ${p} and ${NUM[L(h)[M]]}-card support, bid game: 4${SY[M]}.`, 'B.support-after-new-suit');
  return R(B(4, M), `You bid a new suit first, holding ${NUM[L(h)[M]]}-card support for ${SN[M]} and game values. Opener's rebid shows a minimum (11-14), so now support: 4${SY[M]}.`, 'B.support-after-new-suit');
}
// With a fit, the losers can show slam where the points don't: ask with 4NT when they say 12 tricks,
// you hold 2+ key cards and no void (a void makes RKCB unreliable). Returns null otherwise.
function ltcSlam(h, T, pl, desc) {
  const k = losers(h), t = 24 - k - pl;
  if (t < 12 || kcList(h, T).length < 2 || L(h).some(n => n === 0)) return null;
  return R('4N', `${desc}: a ${SN[T].replace(/s$/, '')} fit. Count losers: yours ${k} (${loserBreak(h)}), partner's about ${pl}. 24 − (${k} + ${pl}) = ${t} tricks, enough for slam if you're not missing two key cards: ask with 4NT (RKCB).`, 'G.rkcb-ask');
}
// A minor-suit fit with slam-going losers: RKCB without a void; with a void (RKCB unreliable),
// bid the slam when every side suit is controlled in your hand (ace, king, void or singleton).
function minorSlamTry(h, T, pl, desc) {
  const k = losers(h), t = 24 - k - pl, l = L(h);
  if (t < 12) return null;
  if (!l.some(n => n === 0)) return ltcSlam(h, T, pl, desc);
  const side = [0, 1, 2, 3].filter(s => s !== T), open = side.filter(s => !firstCtl(h, s) && !secondCtl(h, s));
  if (open.length) return null;
  return R(B(6, T), `${desc}: a ${SN[T].replace(/s$/, '')} fit. Count losers: yours ${k} (${loserBreak(h)}), partner's about ${pl}: 24 − ${k + pl} = ${t} tricks. With a void RKCB can't help, but you control every side suit yourself: bid the slam, 6${SY[T]}.`, 'D.game-choice');
}
// Responder with game values chooses between 3NT and a suit game. 3NT needs every suit your side
// hasn't bid stopped in your hand, and no singleton or void; otherwise show a second five-card
// suit, show a stopper on the way (with a minor fit), or bid five of the minor.
// used: suits your side has bid; fitM: an agreed minor (or -1). Returns null when 3NT is fine.
function gameChoice(h, x, used, fitM, why, id, noNewSuit, rl) {
  const l = L(h), unbid = [0, 1, 2, 3].filter(u => !used.includes(u));
  const open = unbid.filter(u => !stop(h, u)), short = l.some(n => n === 0);   // a singleton in partner's suit is fine; an unbid singleton shows up as unstopped
  const nm = a => a.map(u => SN[u]).join(' and ');
  // No fit yet: a second five-card suit is shown before 3NT (length first, while looking for a fit).
  const sec = unbid.filter(u => l[u] >= 5 && bv(B(cheapest(u, x), u)) < bv('4C')).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (sec !== undefined && !noNewSuit && fitM < 0) { const b = B(Math.max(3, cheapest(sec, x)), sec); return R(b, `${why}. No fit has been found yet, so show your length before settling for no-trumps: your ${NUM[l[sec]]} ${SN[sec]}, ${plain(b)}, forcing. Partner raises with support, or picks the game.`, 'D.game-choice'); }
  if (!open.length && !short) return null;
  if (fitM >= 0) {
    // Stoppers are shown only in suits nobody has bid, at the cheapest level (the 2-level is fine after a 2-level response: game is in view and a new suit is forcing).
    const lo = rl === 2 ? 2 : 3;
    const sh = unbid.filter(u => stop(h, u) && bv(B(Math.max(lo, cheapest(u, x)), u)) < bv('3N')).sort((a, b) => a - b)[0];
    if (sh !== undefined && !noNewSuit && open.length) { const b = B(Math.max(lo, cheapest(sh, x)), sh); return R(b, `${why}. 3NT is only safe if partner covers ${nm(open)}, so show your ${SN[sh].replace(/s$/, '')} stopper first: ${plain(b)}. Partner bids 3NT with the other suits stopped; otherwise he goes back to ${SN[fitM]} and you play 5${SY[fitM]}.`, 'D.game-choice'); }
    return R(B(5, fitM), `${why}. With ${open.length ? `nothing in ${nm(open)}` : 'a void'}, no-trumps is risky: play in your minor fit, 5${SY[fitM]}.`, 'D.game-choice');
  }
  return null;
}
// Opener's third call after responder's game-choice bids above (new suit at the 3-level, or a stopper).
function openerAfterChoice(h, seq) {
  const p = hcp(h), l = L(h), o = ST.indexOf(seq[0][1]), r = seq[1], x = seq[2], a = seq[3];
  // After our jump shift, partner rebids his major: raise with three, else 3NT.
  if (/^\d[CDHS]$/.test(r) && /^\d[CDHS]$/.test(x) && x[1] !== r[1] && x[1] !== seq[0][1] && +x[0] === cheapest(ST.indexOf(x[1]), r) + 1 && a && a[1] === r[1] && +a[0] === 3 && ST.indexOf(r[1]) >= 2) {
    const rs = ST.indexOf(r[1]);
    const o1 = ST.indexOf(seq[0][1]);
    if (l[rs] < 3 && o1 >= 2 && l[o1] >= 6) return R(B(4, o1), `Partner rebids his ${SN[rs]}, but with ${cardsOf(l[rs], rs)} there's no fit. Your ${NUM[l[o1]]} ${SN[o1]} make the trump suit: 4${SY[o1]}.`, 'D.game-choice');
    return l[rs] >= 3 ? R(B(4, rs), `Partner rebids his ${SN[rs]}: five or more. With ${l[rs]}, game: 4${SY[rs]}.`, 'D.game-choice') : R('3N', `Partner rebids his ${SN[rs]}, but with ${cardsOf(l[rs], rs)} there's no fit: 3NT.`, 'D.game-choice');
  }
  // We rebid our minor after a 2-level response; partner (with a fit) shows a stopper in a new suit.
  if (o < 2 && /^\d[CDHS]$/.test(r) && +r[0] === 2 && x === B(cheapest(o, r), o) && /^[23][CDHS]$/.test(a || '') && a[1] !== ST[o] && a[1] !== r[1]) {
    const as = ST.indexOf(a[1]), rest = [0, 1, 2, 3].filter(u => u !== o && u !== as && u !== ST.indexOf(r[1]));
    if (as >= 2 && l[as] >= 4) return R(B(4, as), `Partner's ${plain(a)} shows ${SN[as]} (a stopper at least), and you hold four: game in the major, 4${SY[as]}.`, 'D.game-choice');
    if (rest.every(u => stop(h, u))) return R('3N', `Partner's ${plain(a)} shows a ${SN[as].replace(/s$/, '')} stopper and asks about the rest. You have ${rest.map(u => SN[u]).join(' and ')} stopped: 3NT.`, 'D.game-choice');
    const b = B(cheapest(o, a), o);
    return R(b, `Partner's ${plain(a)} shows a ${SN[as].replace(/s$/, '')} stopper, but you have nothing in ${rest.filter(u => !stop(h, u)).map(u => SN[u]).join(' or ')}. Go back to your ${SN[o]}: ${plain(b)} says "no stopper", and partner picks 5${SY[o]}.`, 'D.game-choice');
  }
  if (!/^\d[CDHS]$/.test(r) || !/^3[CDHS]$/.test(a)) return undefined;
  const rs = ST.indexOf(r[1]), xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, as = ST.indexOf(a[1]);
  // 2/1: partner's slow 3M after our minimum rebid shows slam interest.
  if (SYS.twoOne && +r[0] === 2 && as === o && o >= 2 && xs !== o && +x[0] === 2 && a === B(3, o)) {
    const c = cheapestCue(h, o, a);
    if (c && (p >= 13 || kcList(h, o).length >= 2)) return R(c[1], `Partner's slow 3${SY[o]} agrees your ${SN[o]} with slam interest. Show your cheapest ace or void: ${plain(c[1])} (a control bid).`, 'G.cue-bid-answer');
    return R(B(4, o), `Partner's 3${SY[o]} agrees your ${SN[o]} with slam interest. With a minimum and nothing to show, sign off: 4${SY[o]}.`, 'G.cue-bid-answer');
  }
  if (SYS.twoOne && +r[0] === 2 && xs === o && as === rs && rs >= 2 && +x[0] === 2) {
    if (l[rs] >= 2) {
      const c = cheapestCue(h, rs, a);
      if (c && (p >= 13 || kcList(h, rs).length >= 2)) return R(c[1], `Partner's slow 3${SY[rs]} shows a good suit and slam interest. With ${l[rs]} ${SN[rs]} you have a fit; show your cheapest ace or void: ${plain(c[1])} (a control bid).`, 'G.cue-bid-answer');
      return R(B(4, rs), `Partner's 3${SY[rs]} shows slam interest. With ${l[rs]} ${SN[rs]} but a minimum and nothing to show, sign off: 4${SY[rs]}.`, 'G.cue-bid-answer');
    }
    return R(B(4, rs), `Partner's 3${SY[rs]} shows a good six-card suit. With ${cardsOf(l[rs], rs)} the six-one fit is still the game: 4${SY[rs]}.`, 'D.game-choice');
  }
  // Partner raised our new minor (after his 2-level response): show a control, or 3NT / 4m.
  if (+r[0] === 2 && xs >= 0 && xs < 2 && xs !== o && a === B(3, xs)) {
    const c = cheapestCue(h, xs, a);
    if (c) return R(c[1], `Partner's 3${SY[xs]} agrees ${SN[xs]} with game forced, and may be looking for slam. Show your cheapest ace or void: ${plain(c[1])} (a control bid).`, 'G.cue-bid-answer');
    const rest = [0, 1, 2, 3].filter(u => u !== xs && u !== o && u !== rs);
    return rest.every(u => stop(h, u)) ? R('3N', `Partner's 3${SY[xs]} agrees ${SN[xs]}. No ace or void to show, but ${rest.map(u => SN[u]).join(' and ')} stopped: 3NT.`, 'G.cue-bid-answer')
      : R(B(4, xs), `Partner's 3${SY[xs]} agrees ${SN[xs]}. No ace or void to show and no stopper for 3NT: 4${SY[xs]}.`, 'G.cue-bid-answer');
  }
  // After a 1-level response, partner's new suit at the 3-level is natural and invitational (11-12, six cards).
  if (+r[0] === 1 && as !== o && as !== rs && as !== xs && xs >= 0 && bv(x) <= bv(B(2, o))) {
    if (p >= 14) { const g = l[as] >= 2 && as >= 2 ? B(4, as) : l[as] >= 3 ? B(5, as) : '3N'; return R(g, `Partner's ${plain(a)} invites with six ${SN[as]} (11-12). With ${p}, accept: ${plain(g)}.`, 'D.game-choice'); }
    return R('P', `Partner's ${plain(a)} invites with six ${SN[as]} (11-12). With ${p}, a minimum, pass.`, 'D.game-choice');
  }
  // Partner showed a stopper after we raised his minor.
  if (xs === rs && rs < 2 && as !== rs) {
    const rest = [0, 1, 2, 3].filter(u => u !== rs && u !== as);
    return rest.every(u => stop(h, u)) ? R('3N', `Partner's ${plain(a)} shows a stopper and looks for 3NT. You have ${rest.map(u => SN[u]).join(' and ')} stopped: 3NT.`, 'D.game-choice')
      : R(B(5, rs), `Partner's ${plain(a)} looks for 3NT, but you have no stopper in ${rest.filter(u => !stop(h, u)).map(u => SN[u]).join(' or ')}: 5${SY[rs]}.`, 'D.game-choice');
  }
  // Partner's new suit at the 3-level (his second suit): forcing.
  if (as !== o && as !== rs && as !== xs) {
    const rest = [0, 1, 2, 3].filter(u => ![o, rs, as, xs].includes(u));
    if (o < 2 && xs === o && rest.length && rest.every(u => stop(h, u))) return R('3N', `Partner's ${plain(a)} shows a stopper (or a second suit) and is forcing. You have ${rest.map(u => SN[u]).join(' and ')} stopped: 3NT.`, 'D.game-choice');
    if (as >= 2 && l[as] >= 3) return R(B(4, as), `Partner's ${plain(a)} shows a second long suit and is forcing. With ${l[as]} ${SN[as]}: 4${SY[as]}.`, 'D.game-choice');
    if (rest.length && rest.every(u => stop(h, u)) && !(as < 2 && l[as] >= 4) && !l.some(n => n === 0)) return R('3N', `Partner's ${plain(a)} is forcing. No major fit, and you hold the one suit nobody has bid (${rest.map(u => SN[u]).join(' and ')}) well stopped: 3NT. Nine tricks are easier than eleven, so don't bypass it for a minor.`, 'D.game-choice');
    if (rest.every(u => stop(h, u)) && l[as] >= 2 && l[rs] >= 2) return R('3N', `Partner's ${plain(a)} is forcing. You have ${rest.map(u => SN[u]).join(' and ') || 'the other suit'} stopped and something in his suits: 3NT.`, 'D.game-choice');
    if (l[rs] >= 3) { const b = B(cheapest(rs, a), rs); return R(b, `Partner's ${plain(a)} is forcing. With ${l[rs]} ${SN[rs]}, support his first suit: ${plain(b)}.`, 'D.game-choice'); }
    if (l[as] >= 4) { const b = B(cheapest(as, a), as); return R(b, `Partner's ${plain(a)} is forcing. With ${l[as]} ${SN[as]}, raise: ${plain(b)}.`, 'D.game-choice'); }
    if (l[o] >= 6) { const b = B(cheapest(o, a), o); return R(b, `Partner's ${plain(a)} is forcing. No fit for him: rebid your six ${SN[o]}, ${plain(b)}.`, 'D.game-choice'); }
    if (o >= 2 && l[o] >= 5 && xs !== o && bv(B(cheapest(o, a), o)) < bv('4C')) { const b = B(cheapest(o, a), o); return R(b, `Partner's ${plain(a)} is forcing, and you have no fit for either of his suits. Show your fifth ${SN[o].replace(/s$/, '')}: ${plain(b)}. Partner raises with two, or bids 3NT.`, 'D.game-choice'); }
    if (l[rs] >= 2 && l.some(n => n <= 1)) { const b = B(cheapest(rs, a), rs); return R(b, `Partner's ${plain(a)} is forcing, and with a singleton no-trumps is doubtful. Give preference to his first suit with two: ${plain(b)}.`, 'D.game-choice'); }
    return R('3N', `Partner's ${plain(a)} is forcing. With nothing better to say: 3NT.`, 'D.game-choice');
  }
  return undefined;
}
// Responder's third call after his game-choice bid: pick the game.
function respAfterChoice(h, seq) {
  const l = L(h), o = ST.indexOf(seq[0][1]), r = seq[1], a = seq[3], z = seq[4];
  // Our stopper show (fit for opener's rebid minor); opener went back to the minor: no stopper, so 5m.
  if (o < 2 && /^\d[CDHS]$/.test(r) && +r[0] === 2 && seq[2] === B(cheapest(o, r), o) && /^2[CDHS]$/.test(a || '') && a[1] !== ST[o] && a[1] !== r[1]) {
    if (z === 'P' || gameBid(z) || /^[567]/.test(z || '')) return AP('Partner chose the game.');
    if (z === '2N') return R('3N', `Partner's 2NT shows the missing stopper: 3NT.`, 'D.game-choice');
    if (z && z[1] === ST[o]) return R(B(5, o), `Partner went back to ${SN[o]}: no stopper in the open suit. Play the minor game, 5${SY[o]}.`, 'D.game-choice');
    return R(B(5, o), `No sure stopper in every suit: play 5${SY[o]}.`, 'D.game-choice');
  }
  if (!/^\d[CDHS]$/.test(r) || !/^3[CDHS]$/.test(a || '')) return undefined;
  // We raised opener's new minor slowly; he answered. Slam, 5m or 3NT.
  const xs2 = /^\d[CDHS]$/.test(seq[2]) ? ST.indexOf(seq[2][1]) : -1;
  if (+r[0] === 2 && xs2 >= 0 && xs2 < 2 && xs2 !== o && a === B(3, xs2)) {
    const T = xs2, k = losers(h), t = 24 - k - 7, zs = isCue(z, T) || (/^[34][CDHS]$/.test(z) && z[1] !== ST[T]) ? ST.indexOf(z[1]) : -1;
    const open = [0, 1, 2, 3].filter(u => u !== T && u !== zs && !firstCtl(h, u) && !secondCtl(h, u));
    if (t >= 12 && !open.length) return R(B(6, T), `${zs >= 0 ? `Partner's ${plain(z)} shows ${SN[zs]} control. ` : ''}You control every side suit and your ${k} losers opposite about 7 say ${t} tricks: bid the slam, 6${SY[T]}.`, 'G.cue-bid-decide');
    if (z === '3N' && t < 11) return R('P', `Partner's 3NT shows the other suits stopped and nothing more to show. With ${k} losers there's no slam: pass.`, 'G.cue-bid-decide');
    return R(B(5, T), `${t >= 12 ? `Slam is possible on the losers, but ${open.map(u => SN[u]).join(' and ')} may be open` : `Your ${k} losers opposite about 7 say ${t} tricks`}: play 5${SY[T]}.`, 'G.cue-bid-decide');
  }
  // 2/1 slam try (3M): opener answered with a control bid.
  const slowT = a === B(3, ST.indexOf(r[1])) ? ST.indexOf(r[1]) : a === B(3, o) && o >= 2 && /^2[CDHS]$/.test(seq[2]) && seq[2][1] !== seq[0][1] ? o : -1;
  if (SYS.twoOne && +r[0] === 2 && slowT >= 2 && isCue(z, slowT)) {
    const T = slowT, zs = ST.indexOf(z[1]), k = losers(h);
    const open = [0, 1, 2, 3].filter(u => u !== T && u !== zs && u !== o && !firstCtl(h, u) && !secondCtl(h, u));
    if (!open.length && 24 - k - 7 >= 12) return R(B(6, T), `Partner's ${plain(z)} shows first-round control of ${SN[zs]}. Every suit is now covered and your ${k} losers opposite about 7 say 12 tricks: bid the small slam, 6${SY[T]}.`, 'G.cue-bid-decide');
    return R(B(4, T), `Partner's ${plain(z)} shows ${SN[zs]} control, but ${open.length ? `${open.map(u => SN[u]).join(' and ')} may be open` : 'the losers don\'t quite reach 12 tricks'}: sign off in 4${SY[T]}.`, 'G.cue-bid-decide');
  }
  if (z === 'P' || gameBid(z) || /^[567]/.test(z)) return AP('Partner chose the game.');
  const rs = ST.indexOf(r[1]), as = ST.indexOf(a[1]), zs = /^\d[CDHS]$/.test(z) ? ST.indexOf(z[1]) : -1;
  if (zs < 0) return undefined;
  const own6 = [0, 1, 2, 3].filter(u => u !== o && l[u] >= 6).sort((u, v) => l[v] - l[u] || v - u)[0];
  if (zs === o && o >= 2 && l[o] === 1 && own6 !== undefined) { const g = own6 >= 2 ? B(4, own6) : B(5, own6); return R(g, `Partner rebids his ${SN[o]}, but you have only one, and ${NUM[l[own6]]} ${SN[own6]} of your own: play there, ${plain(g)}.`, 'D.game-choice'); }
  if (zs === o && o >= 2 && l[o] <= 1 && seq[2][1] !== seq[0][1]) return R('3N', `Partner's ${plain(z)} shows a fifth ${SN[o].replace(/s$/, '')}, but with ${cardsOf(l[o], o)} there's no fit: 3NT.`, 'D.game-choice');
  if (zs === o && o >= 2 && l[o] >= 1) return R(B(4, o), `Partner rebids his ${SN[o]}: five or more${l[o] ? ` opposite your ${l[o]}` : ''}. The major game: 4${SY[o]}.`, 'D.game-choice');
  if (zs === o && o < 2 && l[o] >= 3) return R(B(5, o), `Partner has no stopper for 3NT and rebids his ${SN[o]}. With ${l[o]} of them: 5${SY[o]}.`, 'D.game-choice');
  if (zs === rs || zs === as) { const g = zs >= 2 ? B(4, zs) : B(5, zs); return R(g, `Partner supports your ${SN[zs]}: game, ${plain(g)}.`, 'D.game-choice'); }
  const best = [rs, as].sort((u, v) => l[v] - l[u] || v - u)[0], g = best >= 2 ? B(4, best) : B(5, best);
  return R(bv(g) > bv(z) ? g : 'P', `No fit for partner: play game in your longest suit, ${plain(g)}.`, 'D.game-choice');
}
// Responder's second call after opener's rebid. seq = [opening, response, rebid].
function respAfterRebid(h, seq) {
  const p = hcp(h), l = L(h), r = seq[1], x = seq[2];
  if (x === 'P' || !/^\d/.test(x)) return gap('The chart has no call here.');
  const rs = ST.indexOf(r[1]), rl = +r[0], xs = ST.indexOf(x[1]), xl = +x[0];
  if (xs === rs) {   // opener raised responder's suit
    if (rs < 2) {   // opener raised responder's minor: no-trump is the usual game
      const o0 = ST.indexOf(seq[0][1]), mj = o0 >= 2 && l[o0] >= 3;
      if (xl >= rl + 2) return p >= 10 ? R(mj ? B(4, o0) : '3N', `Opener's jump raise shows 15-19. With ${p} (10+) bid game: ${mj ? `4${SY[o0]}, with ${l[o0]} of opener's ${SN[o0]}` : '3NT, nine tricks instead of eleven'}.`, 'D.after-double-raise') : R('P', `Opener's jump raise shows 15-19. With ${p} (6-9), pass.`, 'D.after-double-raise');
      const gc = why => gameChoice(h, x, [rs, o0], rs, why, 'D.after-raise', false, rl);
      if (!mj && ((xl >= rl + 2 && p >= 10) || (xl === 2 && p >= 13) || (xl !== 2 && xl < rl + 2 && p >= 12))) { const sl = minorSlamTry(h, rs, xl >= rl + 2 ? 6 : 7, `Opener raised your ${SN[rs]}`); if (sl) return sl; const c = gc(`Opener raised your ${SN[rs]}: a fit, and game values`); if (c) return c; }
      if (xl === 2) return p >= 13 ? R('3N', `Opener's raise shows 11-14. With ${p} (13+), bid 3NT.`, 'D.after-raise') : p >= 11 ? R('2N', `Opener's raise shows 11-14. With ${p} (11-12), invite with 2NT.`, 'D.after-raise') : R('P', `Opener's raise shows 11-14. With ${p} (10 or less), pass.`, 'D.after-raise');
      return p >= 12 ? R(mj ? B(4, o0) : '3N', `Opener's ${plain(x)} shows 11-14. With ${p} (12+) bid game: ${mj ? `4${SY[o0]}, with ${l[o0]} of opener's ${SN[o0]}` : '3NT'}.`, 'D.after-raise') : R('P', `Opener's ${plain(x)} shows 11-14. With ${p}, pass.`, 'D.after-raise');
    }
    const dbl = xl >= rl + 2, s = slamTry(h, rs, dbl ? 15 : 11, dbl ? "Opener's double raise (15-19)" : "Opener's raise (11-14)");
    if (s) return s;
    if (xl === rl + 1) {
      // Opener's simple raise is about 7 losers: 24 − (yours + 7) = tricks.
      const k = losers(h), t = 24 - k - 7;
      if (p < 13 && t >= 10) return R(B(4, rs), `Opener's simple raise shows 11-14 (about 7 losers). You have ${p} HCP but ${k} losers (${loserBreak(h)}): 24 − (${k} + 7) = ${t} tricks, so bid 4${SY[rs]}.`, 'D.after-raise');
      if (p <= 10 && t === 9 && xl === 2) return R(B(3, rs), `Opener's simple raise shows 11-14. You have ${p} HCP but ${k} losers: 24 − (${k} + 7) = 9 tricks, so invite with 3${SY[rs]}.`, 'D.after-raise');
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
    if (l[rs] >= 5) {   // a five-card or longer suit of your own
      const n5 = l[rs], maj = rs >= 2;
      if (p <= 10) return maj && n5 >= 6 ? R(B(2, rs), `Opener's 1NT shows 12-14. With ${p} and ${NUM[n5]} ${SN[rs]}, sign off in 2${SY[rs]}.`, 'D.after-1nt') : R('P', `Opener's 1NT shows 12-14. With ${p} (10 or less), pass.`, 'D.after-1nt');
      if (p <= 12) return maj && n5 >= 6 ? R(B(3, rs), `Opener's 1NT shows 12-14. With ${p} (11-12) and ${NUM[n5]} ${SN[rs]}, invite with 3${SY[rs]}.`, 'D.after-1nt') : R('2N', `Opener's 1NT shows 12-14. With ${p} (11-12), invite with 2NT.`, 'D.after-1nt');
      return maj && n5 >= 6 ? R(B(4, rs), `Opener's 1NT shows 12-14. With ${p} (13+) and ${NUM[n5]} ${SN[rs]}, bid 4${SY[rs]}.`, 'D.after-1nt') : gameChoice(h, x, [rs], -1, `Opener's 1NT shows 12-14 balanced and you have game values (${p})`) || R('3N', `Opener's 1NT shows 12-14. With ${p} (13+), bid 3NT.`, 'D.after-1nt');
    }
    if (p > 20) return R('6N', `Opener's 1NT shows 12-14. With ${p} you have 33+ between you: 6NT.`, 'D.after-1nt');
    if (p > 15) return R('3N', `Opener's 1NT shows 12-14. With ${p} (16-20) that's under 33 for slam: 3NT.`, 'D.after-1nt');
    if (p <= 10) return R('P', `Opener's 1NT shows 12-14 balanced. With ${p} (10 or less), pass.`, 'D.after-1nt');
    if (p <= 12) return R('2N', `Opener's 1NT shows 12-14. With ${p} (11-12), invite with 2NT.`, 'D.after-1nt');
    return R('3N', `Opener's 1NT shows 12-14. With ${p} (13+), bid 3NT.`, 'D.after-1nt');
  }
  if (x === '2N' && rl === 1) {
    if (rs >= 2 && l[rs] >= 5) {
      if (p < 7) return R('P', `Opener's 2NT shows 18-19. With only ${p}, pass.`, 'D.after-2nt');
      return l[rs] >= 6 ? R(B(4, rs), `Opener's 2NT shows 18-19. With ${p} (7+) and ${NUM[l[rs]]} ${SN[rs]}, bid 4${SY[rs]}.`, 'D.after-2nt')
        : R(B(3, rs), `Opener's 2NT shows 18-19. With ${p} (7+) and five ${SN[rs]}, bid 3${SY[rs]} (forcing): opener bids 4${SY[rs]} with three, else 3NT.`, 'D.after-2nt');
    }
    if (p >= 7) return R('3N', `Opener's 2NT shows 18-19 balanced. With ${p} (7+), bid 3NT.`, 'D.after-2nt');
    return R('P', `Opener's 2NT shows 18-19. With only ${p}, pass.`, 'D.after-2nt');
  }
  // Opener's other rebids (chart D): "after weak: ≤10 pass or correct · after strong: 10+ game,
  // 6-9 sign off". Where the chart names no specific call (invites, games in a minor,
  // after a reverse or jump shift) the rule stays silent.
  const o = ST.indexOf(seq[0][1]);
  if (xs === o) {
    if (x === B(cheapest(o, r), o)) {   // simple rebid of opener's suit: 11-14
      // A rebid major promises six, so three cards or a doubleton honour (Ax, Kx, Qx) is a fit.
      const hx = l[o] === 2 && h[o].some(c => c >= 12), fit = o >= 2 && (l[o] >= 3 || hx);
      const fw = hx ? `${SN[o].replace(/s$/, '')} doubleton honour (${h[o].map(c => RANK[c] || c).join('')}): opposite six, that's a fit` : `${l[o]} ${SN[o]}: a fit`;
      if (fit && p >= 13) return ltcSlam(h, o, 7, `Opener's ${plain(x)} shows six ${SN[o]}`) || R(B(4, o), `Opener's ${plain(x)} shows 11-14 with six ${SN[o]}. ${fw[0].toUpperCase() + fw.slice(1)}, and with ${p} (13+) bid game: 4${SY[o]}.`, 'D.after-major-rebid');
      if (fit && p >= 10 && xl === 2) return R(B(3, o), `Opener's ${plain(x)} shows 11-14 with six ${SN[o]}. ${fw[0].toUpperCase() + fw.slice(1)}. With ${p} (10-12), invite with 3${SY[o]}.`, 'D.after-major-rebid');
      if (p <= 10) return R('P', `Opener's ${plain(x)} is a minimum rebid (11-14). With ${p} (10 or less), pass.`, 'D.after-minimum');
      const own6 = l[rs] >= 6 && rs !== o;
      if (p <= 12) {
        if (l[o] >= 3) return R(B(3, o), `Opener's ${plain(x)} is a minimum (11-14). With ${p} (11-12) and ${l[o]} ${SN[o]}, invite with 3${SY[o]}.`, 'D.after-minimum');
        if (own6) return R(B(3, rs), `Opener's ${plain(x)} is a minimum (11-14). With ${p} (11-12) and ${NUM[l[rs]]} ${SN[rs]}, invite with 3${SY[rs]}.`, 'D.after-minimum');
        return R('2N', `Opener's ${plain(x)} is a minimum (11-14). With ${p} (11-12), invite with 2NT.`, 'D.after-minimum');
      }
      if (o >= 2 && l[o] >= 2) return R(B(4, o), `Opener's ${plain(x)} shows six ${SN[o]}. With ${p} (13+) and ${l[o]} of them, bid 4${SY[o]}.`, 'D.after-minimum');
      if (own6 && rs >= 2 && SYS.twoOne && rl === 2 && (p >= 16 || losers(h) <= 5)) return R(B(3, rs), `Opener's ${plain(x)} is a minimum, but game is already forced. With ${p} HCP and ${losers(h)} losers you have slam interest: bid slowly, 3${SY[rs]} (a good six-card suit, forcing). Jumping to 4${SY[rs]} would show a minimum (fast arrival).`, 'D.21-slow');
      if (own6 && rs >= 2) return R(B(4, rs), `Opener's ${plain(x)} is a minimum. With ${p} (13+) and ${NUM[l[rs]]} ${SN[rs]}, bid 4${SY[rs]}.`, 'D.after-minimum');
      if (o < 2 && l[o] >= 3) { const sl = minorSlamTry(h, o, 7, `Opener rebid his ${SN[o]} and you hold ${l[o]}`); if (sl) return sl; }
      return gameChoice(h, x, [o, rs], o < 2 && l[o] >= 3 ? o : -1, `Opener's ${plain(x)} is a minimum (11-14) and you have game values (${p})`, 'D.after-minimum', rl === 1, rl) || R('3N', `Opener's ${plain(x)} is a minimum (11-14). With ${p} (13+), bid 3NT.`, 'D.after-minimum');
    }
    if (xl === 3 && o < 2 && x === B(cheapest(o, r) + 1, o)) {   // jump rebid of a minor: 15-19, 6+ cards
      const unsafe = [0, 1, 2, 3].filter(u => u !== o && u !== rs).some(u => !stop(h, u)) || l.some(n => n === 0);
      if (p >= 10 && unsafe && l[o] >= 2) return R(B(5, o), `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}, and you have ${l[o]}: a fit. 3NT isn't safe (a suit unstopped, or a void), so play in the minor: 5${SY[o]}.`, 'D.after-jump-rebid');
      if (p >= 10 && unsafe) { const c = gameChoice(h, x, [o, rs], -1, `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}`); if (c) return c; }
      return p >= 10 ? R('3N', `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}. With ${p} (10+), bid 3NT: nine tricks instead of eleven.`, 'D.after-jump-rebid')
        : R('P', `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}. With ${p} (6-9), pass.`, 'D.after-jump-rebid');
    }
    if (rl === 2 && xl === 3 && o >= 2 && x === B(3, o)) {   // after a 2-level response (9+): game
      return l[o] >= 2 ? slamTry(h, o, 15, `Opener's jump to ${plain(x)} (six ${SN[o]}, 15+): a fit, since your ${l[o]} make 8+ trumps.`) || R(B(4, o), `Opener's jump to ${plain(x)} shows six ${SN[o]} and extras. With ${p} (9+) and ${l[o]} ${SN[o]}, bid 4${SY[o]}.`, 'D.after-jump-rebid')
        : R('3N', `Opener's jump to ${plain(x)} shows six ${SN[o]}. With ${p} (9+) but ${cardsOf(l[o], o)}, bid 3NT.`, 'D.after-jump-rebid');
    }
    if (rl === 1 && xl === 3 && o >= 2) {   // jump rebid of a major: 15-19, 6+ cards
      if (p >= 10 && l[o] <= 1 && rs >= 2 && l[rs] >= 6) return R(B(4, rs), `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}, but you have ${cardsOf(l[o], o)} and ${NUM[l[rs]]} ${SN[rs]} of your own. Your suit is the better trump suit: 4${SY[rs]}.`, 'D.after-jump-rebid');
      if (p >= 10) return l[o] >= 2 ? slamTry(h, o, 15, `Opener's jump to ${plain(x)} (six ${SN[o]}, 15-19): a fit, since your ${l[o]} make 8+ trumps.`) || R(B(4, o), `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}. With ${p} (10+) and ${l[o]} ${SN[o]}, bid game: 4${SY[o]}.`, 'D.after-jump-rebid')
        : R('3N', `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}. With ${p} (10+) you want game, but with ${cardsOf(l[o], o)} there's no 8-card fit: 3NT.`, 'D.after-jump-rebid');
      return R('P', `Opener's jump to ${plain(x)} shows 15-19 with six ${SN[o]}. With ${p} (6-9), sign off: pass.`, 'D.after-jump-rebid');
    }
    return gap('The chart has no continuation after this rebid.');
  }
  if (x === '2N' && rl === 2) {   // 12-14 balanced after a 2-level response
    // No fit yet: with a second five-card suit (or 6-5), show it before settling for 3NT.
    const o2 = ST.indexOf(seq[0][1]), sec2 = [0, 1, 2, 3].filter(u => u !== rs && u !== o2 && l[u] >= 5 && l[rs] >= 5).sort((a, b) => l[b] - l[a] || b - a)[0];
    if (p >= 11 && o2 < 2 && l[o2] >= 4 && l.some(n => n <= 1)) { const sl = minorSlamTry(h, o2, 7, `Opener's 2NT and your ${l[o2]} ${SN[o2]}`); if (sl) return sl; const c = gameChoice(h, x, [o2, rs], o2, `Opener's 2NT shows 12-14 balanced, and you have a ${SN[o2].replace(/s$/, '')} fit with a short suit`, 'D.game-choice', false, rl); if (c) return c; }
    if (p >= 11 && sec2 !== undefined && !(o2 >= 2 && l[o2] >= 3)) return R(B(3, sec2), `Opener's 2NT shows 12-14 balanced, and game is on. No fit has been found yet, so show your shape before settling for no-trumps: ${plain(B(3, sec2))} shows ${NUM[l[rs]]} ${SN[rs]} and ${NUM[l[sec2]]} ${SN[sec2]}, forcing. Partner supports one of your suits, or bids 3NT with the rest well held.`, 'D.game-choice');
    if (p >= 11) return o >= 2 && l[o] >= 3 ? R(B(4, o), `Opener's 2NT shows 12-14 balanced. With ${p} (11+) and ${l[o]} ${SN[o]}, bid 4${SY[o]}.`, 'D.after-1nt') : R('3N', `Opener's 2NT shows 12-14 balanced. With ${p} (11+), bid 3NT.`, 'D.after-1nt');
    return R('P', `Opener's 2NT shows 12-14 balanced. With ${p} (9-10), pass.`, 'D.after-1nt');
  }
  if (x === '3N' || gameBid(x)) return AP('Opener bid game.');
  const low21 = SYS.twoOne && rl === 2 && xs < 4 && xs !== rs && xs !== o && xl === cheapest(xs, r);   // 2/1: no barrier after a 2-over-1
  if (xs < 4 && xs !== rs && xs !== o && bv(x) > bv(B(2, o)) && !low21) {   // reverse (15-19) or jump shift (20-22)
    const js = xl === cheapest(xs, r) + 1, fitO = o >= 2 && l[o] >= 3, fitX = xs >= 2 && l[xs] >= 4;
    const tag = js ? "Opener's jump shift shows 20-22 and is game forcing" : "Opener's reverse shows 15-19 and is forcing";
    if (js || p >= 10) {
      if (fitO) return R(B(4, o), `${tag}. With ${l[o]} ${SN[o]}, bid game there: 4${SY[o]}.`, js ? 'D.after-jump-shift' : 'D.after-reverse');
      if (js && rs >= 2 && l[rs] >= 5 && l[xs] <= 1 && bv(B(cheapest(rs, x), rs)) < bv('4C')) { const b = B(cheapest(rs, x), rs); return R(b, `${tag}. No fit for his ${SN[xs]} yet, so show your length before settling for no-trumps: rebid your ${NUM[l[rs]]} ${SN[rs]}, ${plain(b)}. Opener raises with three, or bids 3NT.`, 'D.after-jump-shift'); }
      const mf = o < 2 && l[o] >= 3 ? o : xs < 2 && l[xs] >= 4 ? xs : -1;
      if (mf >= 0) { const sl = minorSlamTry(h, mf, js ? 5 : 6, `${tag}`); if (sl) return sl; const c = gameChoice(h, x, [o, rs, xs], mf, `${tag}: a ${SN[mf].replace(/s$/, '')} fit, and game values`, '', true); if (c) return c; }
      if (fitX) return R(B(4, xs), `${tag}. With ${l[xs]} ${SN[xs]}, bid game there: 4${SY[xs]}.`, js ? 'D.after-jump-shift' : 'D.after-reverse');
      if (rs >= 2 && l[rs] >= 6) return R(B(4, rs), `${tag}. With ${NUM[l[rs]]} ${SN[rs]}, bid 4${SY[rs]}.`, js ? 'D.after-jump-shift' : 'D.after-reverse');
      return gameChoice(h, x, [o, rs, xs], -1, `${tag}, and you have game values`, '') || R('3N', `${tag}. ${js ? 'Never pass: ' : `With ${p} (10+), `}bid 3NT.`, js ? 'D.after-jump-shift' : 'D.after-reverse');
    }
    if (fitX) return R(B(3, xs), `${tag}. With ${p} (6-9) and ${l[xs]} ${SN[xs]}, raise to 3${SY[xs]}.`, 'D.after-reverse');
    if (l[o] >= 3 || (l[o] >= 2 && o >= 2)) return R(B(cheapest(o, x), o), `${tag}. With ${p} (6-9), give preference to opener's first suit: ${plain(B(cheapest(o, x), o))}.`, 'D.after-reverse');
    if (l[rs] >= 5) return R(B(cheapest(rs, x), rs), `${tag}. With ${p} (6-9), rebid your ${SN[rs]}: ${plain(B(cheapest(rs, x), rs))}.`, 'D.after-reverse');
    return R(bv('2N') > bv(x) ? '2N' : '3N', `${tag}. With ${p} (6-9) and nothing else to say, ${bv('2N') > bv(x) ? '2NT' : '3NT'}.`, 'D.after-reverse');
  }
  if (xs < 4 && xs !== rs && (bv(x) <= bv(B(2, o)) || low21)) {   // new suit below the barrier: 11-14
    if (p > 10) {
      if (p <= 12) {
        if (l[o] >= 3) return R(B(3, o), `Opener's ${plain(x)} shows a minimum with a second suit. With ${p} (11-12) and ${l[o]} ${SN[o]}, invite with 3${SY[o]}.`, 'D.after-minimum');
        if (xs >= 2 && l[xs] >= 4) return R(B(3, xs), `Opener's ${plain(x)} shows a minimum with ${SN[xs]}. With ${p} (11-12) and ${l[xs]} of them, invite with 3${SY[xs]}.`, 'D.after-minimum');
        const u6 = [0, 1, 2, 3].find(u => u !== o && u !== rs && u !== xs && l[u] >= 6);
        if (rl === 1 && u6 !== undefined) return R(B(3, u6), `Opener's ${plain(x)} shows a minimum (11-14). With ${p} (11-12) and ${NUM[l[u6]]} ${SN[u6]} of your own, invite with 3${SY[u6]}: natural, not forcing. It describes your hand better than 2NT${l[o] === 0 ? ', which is awkward with a void in partner\'s suit' : ''}.`, 'D.after-minimum');
        return R('2N', `Opener's ${plain(x)} shows a minimum (11-14). With ${p} (11-12), invite with 2NT.`, 'D.after-minimum');
      }
      if (o >= 2 && l[o] >= 3 && SYS.twoOne && rl === 2 && (p >= 15 || losers(h) <= 6) && !ltcSlam(h, o, 7, '')) return R(B(3, o), `Opener's ${plain(x)} shows a minimum, but game is already forced. With ${l[o]} ${SN[o]}, ${p} HCP and ${losers(h)} losers you have slam interest: raise slowly, 3${SY[o]}. Jumping to 4${SY[o]} would show a minimum.`, 'D.21-slow');
      if (o >= 2 && l[o] >= 3) return ltcSlam(h, o, 7, `Opener's ${plain(x)}`) || R(B(4, o), `Opener's ${plain(x)} shows a minimum. With ${p} (13+) and ${l[o]} ${SN[o]}, bid 4${SY[o]}.`, 'D.after-minimum');
      if (xs >= 2 && l[xs] >= 4) return ltcSlam(h, xs, 7, `Opener's ${plain(x)} shows four ${SN[xs]}`) || R(B(4, xs), `Opener's ${plain(x)} shows ${SN[xs]}. With ${p} (13+) and ${l[xs]} of them, bid 4${SY[xs]}.`, 'D.after-minimum');
      if (xs < 2 && l[xs] >= 4) {
        if (rl === 2) return R(B(3, xs), `Opener's ${plain(x)} shows four or more ${SN[xs]}, and you have ${l[xs]}: a fit. Game is already forced, so raise slowly: 3${SY[xs]} sets the trumps and leaves room to look for slam (control bids) or choose between 3NT and 5${SY[xs]}.`, 'D.game-choice');
        const sl = minorSlamTry(h, xs, 7, `Opener's ${plain(x)} and your ${l[xs]} ${SN[xs]}`); if (sl) return sl;
        const c = gameChoice(h, x, [o, rs, xs], xs, `Opener's ${plain(x)}: a ${SN[xs].replace(/s$/, '')} fit, and game values (${p})`, 'D.after-minimum', true, rl); if (c) return c;
      }
      return gameChoice(h, x, [o, rs, xs], -1, `Opener's ${plain(x)} shows a minimum (11-14) and you have game values (${p})`, 'D.after-minimum', rl === 1, rl) || R('3N', `Opener's ${plain(x)} shows a minimum (11-14). With ${p} (13+), bid 3NT.`, 'D.after-minimum');
    }
    if (l[o] >= l[xs] && l[o] >= 2) {
      const b = B(cheapest(o, x), o);
      return R(b, `Opener's ${plain(x)} shows a minimum (11-14) with a second suit. With ${p} (10 or less), give preference to the first suit: you hold ${l[o]} ${SN[o]} and ${l[xs]} ${SN[xs]}, so ${plain(b)}.`, 'D.preference');
    }
    return R('P', `Opener's ${plain(x)} shows a minimum (11-14) with a second suit. With ${p} (10 or less) and more ${SN[xs]} than ${SN[o]}, pass.`, 'D.after-minimum');
  }
  return gap('The chart has no continuation after this rebid.');
}

// ---------- E: 2NT, 2♣, weak twos ----------
// After a transfer over 2NT with 4-5 points: exactly five cards bids 3NT to offer a choice
// of games; opener corrects to 4M with 3+ (chart E, same as over 1NT). Six cards bid 4M.
const choice2N = (h, M) => L(h)[M] === 5;
// Responder to 2NT (pm = 3), or to 2♣-2♦-2NT (pm = 1). pm is the most HCP that passes.
function over2Nx(h, pm) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (p > 10) return gap('The chart has no call opposite 2NT with 11+.');
  if ((H >= 5 && S >= 4) || (S >= 5 && H >= 4)) {
    if (p <= pm) { const M = S >= 5 ? 3 : 2; return R(M === 2 ? '3D' : '3H', `${p} HCP, 5-4 in the majors: transfer to your five-card ${SN[M].replace(/s$/, '')}s with ${M === 2 ? '3♦' : '3♥'}, then pass.`, 'E.2nt-transfer'); }
    return R('3C', `${p} HCP, 5-4 in the majors: 3♣ Stayman. Over 3♦, Smolen: bid your four-card major to show five in the other.`, 'E.2nt-stayman');
  }
  if ((H >= 6 || S >= 6) && p > pm) {
    const M = S >= 6 ? 3 : 2;
    return R(M === 2 ? '4D' : '4H', `${Num(l[M])} ${SN[M]} with enough to play game: Texas ${M === 2 ? '4♦ → 4♥' : '4♥ → 4♠'}.`, 'E.2nt-texas');
  }
  if (H >= 5 || S >= 5) {
    const M = S >= 5 ? 3 : 2;
    if (p > 5) return gap('The chart has no call opposite 2NT for a five-card major with 6+.');
    return R(M === 2 ? '3D' : '3H', `${l[M]} ${SN[M]}: transfer with ${M === 2 ? '3♦' : '3♥'}. ${p <= pm ? `Then pass with 0-${pm}.` : choice2N(h, M) ? 'Then 3NT, to offer a choice of games.' : `Then 4${SY[M]}.`}`, 'E.2nt-transfer');
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
  if (has(h, M, 14) && has(h, M, 13) && has(h, M, 12)) return R('3N', `Solid AKQ in ${SN[M]}: 3NT.`, SYS.ogust ? 'E.ogust-answer' : 'E.weak-two-answer');
  if (SYS.ogust) {   // Ogust: 3♣ min poor · 3♦ min good · 3♥ max poor · 3♠ max good (good = two of the top three)
    const g = [14, 13, 12].filter(r => has(h, M, r)).length >= 2, mx = p >= 8;
    const b = mx ? (g ? '3S' : '3H') : (g ? '3D' : '3C');
    return R(b, `Ogust: ${mx ? `maximum (${p}, 8-10)` : `minimum (${p}, 5-7)`} with a ${g ? 'good suit (two of the top three honours)' : 'poor suit'}: ${plain(b)}.`, 'E.ogust-answer');
  }
  const f = [0, 1, 2, 3].filter(s => s !== M && (has(h, s, 14) || has(h, s, 13)));
  if (p <= 7) return R(B(3, M), `${p} HCP is a minimum (5-7): 3${SY[M]}.`, 'E.weak-two-answer');
  if (!f.length) return R(B(3, M), `${p} HCP but no outside ace or king: 3${SY[M]} (no feature).`, 'E.weak-two-answer');
  if (f.length > 1) return amb('More than one outside feature to show.');
  const s = f[0];
  return R(B(3, s), `${p} HCP (8-10) with an outside ${has(h, s, 14) ? 'ace' : 'king'} in ${SN[s]}: show the feature with 3${SY[s]}.`, 'E.weak-two-answer');
}

// ---------- G: slam tools ----------
// When to ask: once a fit is found, your points + partner's shown minimum = 31+ -> 4NT RKCB.
// Ask only with 2+ key cards yourself; with 0-1, bid game and let partner ask.
// Returns null below 31, so the caller's normal rule applies.
function slamTry(h, T, minP, desc) {
  const p = hcp(h);
  if (p + minP < 31) return null;
  const kc = kcList(h, T).length, g = B(T >= 2 ? 4 : 5, T);
  if (kc < 2) return R(g, `${desc} shows at least ${minP}. With ${p} that's ${p + minP}+ between you, enough to think about slam, but you hold only ${kc} key card${kc === 1 ? '' : 's'}, so don't ask: bid game, ${plain(g)}.`, 'G.slam-game');
  return R('4N', `${desc} shows at least ${minP}. With ${p} that's ${p + minP}+ between you and a ${SN[T]} fit: ask for key cards with 4NT (RKCB).`, 'G.rkcb-ask');
}

// Control (cue) bids, traditional style: once a major fit is agreed and slam is possible, a new
// suit below game shows first-round control (ace or void), cheapest first. Bypassing a suit denies
// first-round control of it. Used instead of RKCB when a suit may be wide open, or with a void.
const firstCtl = (h, s) => L(h)[s] === 0 || has(h, s, 14);
const secondCtl = (h, s) => L(h)[s] === 1 || has(h, s, 13);
const sNm = s => SN[s].replace(/s$/, '');
const isCue = (b, T) => /^[34][CDHS]$/.test(b || '') && b[1] !== ST[T] && bv(b) < bv(B(4, T));
// The cheapest first-round control to show above `last` and below game in T.
function cheapestCue(h, T, last) {
  return [0, 1, 2, 3].filter(u => u !== T && firstCtl(h, u)).map(u => [u, B(cheapest(u, last), u)])
    .filter(([, b]) => bv(b) < bv(B(4, T))).sort((a, b) => bv(a[1]) - bv(b[1]))[0];
}
// Start: slam is possible (29+ between you, or the losers say 12 tricks), but a suit has no
// control in your hand or you hold a void. Returns null to leave the normal rule (RKCB or game).
function cueStart(h, T, last, minP, pl, desc) {
  const p = hcp(h), k = losers(h), l = L(h), side = [0, 1, 2, 3].filter(s => s !== T);
  const pts = p + minP >= 29, ltc = 24 - k - pl >= 12;
  if (!pts && !ltc) return null;
  const ps = /^[34][CDHS]$/.test(last) && last[1] !== ST[T] ? ST.indexOf(last[1]) : -1;   // partner's short suit or good suit: controlled
  const hole = side.filter(s => s !== ps && !firstCtl(h, s) && !secondCtl(h, s)), voids = side.filter(s => l[s] === 0);
  if (!hole.length && !voids.length) return null;
  const c = cheapestCue(h, T, last);
  if (!c) return null;
  const [u, b] = c, why = pts ? `${p} + partner's ${minP}+ = ${p + minP}+` : `your ${k} losers + partner's about ${pl}: 24 − ${k + pl} = ${24 - k - pl} tricks`;
  const skip = side.filter(s => s !== u && !firstCtl(h, s) && bv(B(cheapest(s, last), s)) < bv(b));
  const worry = voids.length ? `with a ${sNm(voids[0])} void, RKCB can't tell you which aces partner holds` : `you have no control in ${hole.map(sNm).join(' or ')}`;
  return R(b, `${desc}: a ${sNm(T)} fit, and slam is possible (${why}). But ${worry}, so make a control bid. ${plain(b)} shows first-round control (ace or void) of ${SN[u]}: the cheapest one you have${skip.length ? `, so it denies one in ${skip.map(s => SN[s]).join(' and ')}` : ''}. Partner shows his cheapest ace or void, or signs off in 4${SY[T]}.`, 'G.cue-bid');
}
// Partner's answer to a control bid: the cheapest ace or void of your own, else sign off.
function cueReply(h, T, last) {
  const ls = ST.indexOf(last[1]), c = cheapestCue(h, T, last), top = B(4, T);
  const head = `Partner's ${plain(last)} is a control bid: an ace or void in ${SN[ls]}, and interest in slam in ${SN[T]}.`;
  if (!c) return R(top, `${head} You have no ace or void to show below 4${SY[T]}, so sign off: 4${SY[T]}. That denies first-round control in the suits you skip.`, 'G.cue-bid-answer');
  const [u, b] = c, skip = [0, 1, 2, 3].filter(s => s !== T && s !== u && !firstCtl(h, s) && bv(B(cheapest(s, last), s)) < bv(b));
  return R(b, `${head} Co-operate: show your cheapest ace or void, ${plain(b)} (${has(h, u, 14) ? `the ${SY[u]}A` : `a ${sNm(u)} void`})${skip.length ? `. Skipping ${skip.map(s => SN[s]).join(' and ')} denies an ace or void there` : ''}.`, 'G.cue-bid-answer');
}
// The control bidder decides after partner's answer: every suit covered → RKCB; a suit where
// neither of you has shown first-round control and you have no king or singleton → stop in game.
function cueDecide(h, T, mine, reply, ans) {
  const top = B(4, T), side = [0, 1, 2, 3].filter(s => s !== T), ps = reply === top ? -1 : ST.indexOf(reply[1]), ms = ST.indexOf(mine[1]);
  const pa = ans && /^[34][CDHS]$/.test(ans) && ans[1] !== ST[T] ? ST.indexOf(ans[1]) : -1;   // shown earlier (shortness / good suit)
  const lim = reply === top ? top : reply;
  // Suits partner could have shown (above my cue, below his answer) but didn't.
  const denied = side.filter(s => s !== ps && s !== ms && bv(B(cheapest(s, mine), s)) < bv(lim));
  const open = side.filter(s => !firstCtl(h, s) && s !== ps && s !== pa && !secondCtl(h, s));
  const said = ps >= 0 ? `Partner's ${plain(reply)} shows first-round control of ${SN[ps]}` : `Partner's 4${SY[T]} denies an ace or void${denied.length ? ` in ${denied.map(s => SN[s]).join(' and ')}` : ''}`;
  if (open.length) {
    const bad = open;
    return reply === top ? R('P', `${said}. Nobody has shown control of ${bad.map(s => SN[s]).join(' or ')}, and you have neither the king nor shortness there: the opponents may cash two tricks. Stop: pass.`, 'G.cue-bid-decide')
      : R(top, `${said}, but nobody has shown control of ${bad.map(s => SN[s]).join(' or ')} and you have neither the king nor shortness there: sign off in 4${SY[T]}.`, 'G.cue-bid-decide');
  }
  return R('4N', `${said}. Every side suit is now controlled, so the only question is how many key cards are missing: 4NT, RKCB.`, 'G.cue-bid-decide');
}

// Roman Key Card Blackwood (5♣ = 0 or 3, 5♦ = 1 or 4, 5♥ = 2 without the trump queen, 5♠ = 2 with it).
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
// The 4NT bidder decides after partner's reply. An unclear reply (0 or 3, 1 or 4) is worked
// out from the points: you asked with 31+ between you, so the opponents hold at most 40 − 31 = 9.
// If the low reading would leave them more key cards than 9 points can hold (three key cards
// need 11+), partner has the high number. If both readings still fit, take the one closer to
// partner's share of the missing points (or high opposite a strong 2NT/2♣ opening).
function askDecide(h, M, reply, strong) {
  const k = kcList(h, M).length, p = hcp(h);
  let poss = (reply === '5C' ? [0, 3] : reply === '5D' ? [1, 4] : [2]).filter(v => v + k <= 5);
  if (!poss.length) return gap('The reply does not fit with the key cards you hold.');
  let pk = poss[0], read = '';
  if (poss.length > 1) {
    const missA = 4 - [0, 1, 2, 3].filter(s => has(h, s, 14)).length, missK = has(h, M, 13) ? 0 : 1;
    // Fewest points that n of the missing key cards can be worth (the trump king 3, aces 4).
    const minPts = n => n <= 0 ? 0 : Math.min(n, missK) * 3 + Math.max(0, n - missK) * 4;
    const pMin = Math.max(0, 31 - p), oppMax = 40 - p - pMin;
    const fits = poss.filter(v => minPts(5 - k - v) <= oppMax);
    if (fits.length === 1) {
      pk = fits[0];
      const ov = poss.find(v => v !== pk), oppKC = 5 - k - ov;
      read = pk > ov ? ` (${poss[0]} or ${poss[1]}: with 31+ between you the opponents have at most ${oppMax} points, too few for the ${oppKC} key cards they'd need if partner had ${ov}, so partner has ${pk})`
        : ` (${poss[0]} or ${poss[1]}: ${pk} is the only reading that fits)`;
    } else {
      const share = (pMin + 2) / Math.max(1, 40 - p), expect = share * (5 - k);
      pk = strong ? poss[1] : (Math.abs(poss[1] - expect) < Math.abs(poss[0] - expect) ? poss[1] : poss[0]);
      read = strong ? ` (${poss[0]} or ${poss[1]}: partner opened with a strong hand, so read it high)`
        : ` (${poss[0]} or ${poss[1]}: partner holds most of the points you don't, so expect about ${expect.toFixed(1)} of the ${5 - k} missing: read it as ${pk})`;
    }
  }
  const tot = k + pk, miss = 5 - tot, rv = bv(reply), five = bv(B(5, M));
  const head = `You hold ${k}, partner's ${plain(reply)} shows ${reply === '5C' ? '0 or 3' : reply === '5D' ? '1 or 4' : '2'} so ${pk} here${read}: ${tot} of 5.`;
  if (miss >= 2) {
    if (rv < five) return R(B(5, M), `${head} Missing two: sign off in 5${SY[M]}.`, 'G.rkcb-decide');
    if (rv === five) return R('P', `${head} Missing two, and partner's reply is already 5${SY[M]}: pass.`, 'G.rkcb-decide');
    return R(B(6, M), `${head} Missing two, but partner's ${plain(reply)} is already past 5${SY[M]}, so the only way out is ${plain(B(6, M))}.`, 'G.rkcb-decide');
  }
  if (miss === 1) return R(B(6, M), `${head} Missing one: bid 6${SY[M]}.`, 'G.rkcb-decide');
  // A grand slam needs all five key cards, the trump queen and a side king, so only ask for
  // kings when the queen is already known (yours, or shown by a 5♠ reply).
  if (has(h, M, 12) || reply === '5S') return R('5N', `${head} All five key cards and the trump queen: 5NT asks for kings, looking for a grand slam.`, 'G.king-ask');
  return R(B(6, M), `${head} All five key cards, but the trump queen is missing, and a grand needs it: bid 6${SY[M]}.`, 'G.rkcb-decide');
}
// Answer 5NT: show your cheapest side king by bidding its suit; with none, 6 of trumps.
function kingReply(h, T) {
  const ks = [0, 1, 2, 3].filter(s => s !== T && has(h, s, 13));
  if (!ks.length) return R(B(6, T), `5NT asks for kings. No side king: sign off in 6${SY[T]}.`, 'G.king-answer');
  return R(B(6, ks[0]), `5NT asks for kings. Show your cheapest side king: ${plain(B(6, ks[0]))} (the ${SN[ks[0]]} king).`, 'G.king-answer');
}
// After partner's answer to 5NT. Asking promised the trump queen, so a side king means a grand.
function grandDecide(h, T, rep) {
  if (rep === B(6, T)) return R('P', `Partner has no side king: stay in 6${SY[T]}.`, 'G.grand');
  return R(B(7, T), `All five key cards, the trump queen, and partner shows a side king: bid the grand slam, 7${SY[T]}.`, 'G.grand');
}
