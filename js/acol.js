// Acol with a weak no-trump (12-14): the second system, from docs/Acol_Weak_NT_Flowchart_A3.pdf.
// The rules here are only used while an Acol set is dealt (SYS.acol, set by buildSet), through
// openingBid, sysCall and competitive. Same conventions as rules.js: R(bid, why, ruleId), or
// amb(why) / gap(why). Rule ids use the Acol chart's letters with "acol" in them.
'use strict';

// ---------- Opening bids ----------
// Longest suit; with equal length the chart's order ♥ > ♠ > ♦ > ♣.
const ACOL_ORDER = [2, 3, 1, 0];
function acolLongest(l) {
  const mx = Math.max(...l);
  return ACOL_ORDER.find(s => l[s] === mx);
}
function acolOpening(h) {
  const p = hcp(h), l = L(h), bal = isBal(h), mx = Math.max(...l);
  if (p >= 23) return R('2C', `${p} HCP: 2♣, 23+ any shape, game forcing.`, 'E.acol-open-2c');
  if (bal) {
    if (p >= 20) return R('2N', `${p} HCP balanced: 2NT (20-22).`, 'E.acol-open-2nt');
    if (p >= 15) { const s = acolLongest(l); return R(B(1, s), `${p} HCP balanced (15-19): open your longest suit, 1${SY[s]}, and rebid no-trumps to show the strength.`, 'OB.acol-suit'); }
    if (p >= 12) return R('1N', `${p} HCP balanced: 1NT (12-14).`, 'A.acol-open-1nt');
    return R('P', `${p} HCP balanced: too weak to open.`, 'OB.acol-pass');
  }
  // Shape counts: 11-12 unbalanced opens when HCP + the two longest suits reach 20 (rule of 20).
  const two = [...l].sort((a, b) => b - a), r20 = p >= 11 && p + two[0] + two[1] >= 20;
  if (p >= 13 || r20) {
    // Two five-card (or longer) suits of equal length: open the higher-ranking.
    const s = mx >= 5 ? [3, 2, 1, 0].find(t => l[t] === mx) : acolLongest(l), eq = l.filter(n => n === l[s]).length > 1;
    const why = mx >= 5 && eq ? ' (5-5: open the higher-ranking suit)' : eq ? ' (equal length: ♥ before ♠ before ♦ before ♣)' : '';
    return R(B(1, s), p >= 13 ? `${p} HCP unbalanced (13-22): open your longest suit, 1${SY[s]}${why}.` : `${p} HCP, but ${p} + ${two[0]} + ${two[1]} (your two longest suits) = ${p + two[0] + two[1]}: with this shape the hand is worth an opening (rule of 20). Open your longest suit, 1${SY[s]}${why}.`, 'OB.acol-suit');
  }
  const s = acolLongest(l);
  if (mx >= 8 && p <= 9) return R(B(4, s), `${NUM[mx]}-card ${SN[s].replace(/s$/, '')} suit and ${p} HCP: pre-empt at the 4-level.`, 'H.acol-preempt');
  if (mx === 7 && p <= 9) return R(B(3, s), `Seven ${SN[s]} and ${p} HCP: pre-empt at the 3-level.`, 'H.acol-preempt');
  if (mx === 6 && s >= 1 && p >= 5 && p <= 10) return R(B(2, s), `Six ${SN[s]} and ${p} HCP: weak two, 2${SY[s]} (5-10).`, 'E.acol-weak-two');
  return R('P', `${p} HCP unbalanced: a suit opening needs 13+, and this is not a weak two or pre-empt. Pass.`, 'OB.acol-pass');
}

// ---------- A: responses to 1NT (12-14) ----------
// Transfers over our 1NT (the switch on the home screen, on by default): 2♦ = 5+ hearts,
// 2♥ = 5+ spades, any strength. Opener completes; responder then passes, invites or bids game.
function acolR1NTTransfer(h) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3], k = losers(h);
  if (H >= 4 && S >= 4 && Math.max(H, S) === 5 && Math.min(H, S) === 4 && p <= 10 && k > 6) return R('2C', `${p} HCP, 5-4 in the majors: 2♣ Stayman, then pass if partner bids one of your majors, otherwise bid your five-card major to play.`, 'A.acol-stayman-weak');
  if (p >= 11 && (H === 4 || S === 4) && Math.max(H, S) <= 4) return null;   // Stayman, as without transfers
  const M = S >= 5 && S >= H ? 3 : H >= 5 ? 2 : -1;
  if (M >= 0) {
    const t = M === 2 ? '2D' : '2H', plan = p >= 12 || k <= 6 ? (l[M] >= 6 ? `then 4${SY[M]}` : 'then 3NT, offering partner the choice') : p === 11 ? (l[M] >= 6 ? `then 3${SY[M]} to invite` : 'then 2NT to invite') : 'then pass';
    return R(t, `${p} HCP with ${NUM[l[M]]} ${SN[M]}${H >= 5 && S >= 5 ? ' (5-5: transfer to spades)' : ''}: ${plain(t)}, a transfer to ${SN[M]}. Partner bids 2${SY[M]}; you ${plan}.`, 'A.acol-transfer');
  }
  if (p <= 10 && l[1] >= 6) return R('2S', `${p} HCP with ${NUM[l[1]]} diamonds: 2♦ would be a transfer, so bid 2♠ (McKendrick, or a weak long minor), then 3♦ to play.`, 'A.acol-weak-minor');
  return null;
}
function acolR1NT(h) {
  if (SYS.transfers) { const t = acolR1NTTransfer(h); if (t) return t; }
  const p = hcp(h), l = L(h), H = l[2], S = l[3], k = losers(h);
  // Shape counts: a long major with 6 losers or fewer is worth game opposite 12-14 (about 8 losers).
  const six0 = [3, 2].find(s => l[s] >= 6), five0 = [3, 2].find(s => l[s] === 5);
  if (p <= 11 && k <= 6 && (six0 !== undefined || five0 !== undefined) && !(H >= 4 && S >= 4)) {
    const lt = `${p} HCP, but only ${k} losers (${loserBreak(h)}): opposite a 12-14 no-trump (about 8 losers) that's 24 − (${k} + 8) = ${24 - k - 8} tricks. `;
    if (six0 !== undefined) return R(B(4, six0), `${lt}With ${NUM[l[six0]]} ${SN[six0]}, bid game: 4${SY[six0]}.`, 'A.acol-major-game');
    return R(B(3, five0), `${lt}With five ${SN[five0]}, 3${SY[five0]} (forcing). Partner bids 4${SY[five0]} with three, else 3NT.`, 'A.acol-major-3');
  }
  if (H >= 4 && S >= 4 && Math.max(H, S) >= 5 && p <= 11) return R('2C', `${p} HCP, 5-4 in the majors: 2♣ Stayman, then pass if partner bids one of your majors, otherwise bid your five-card major to play.`, 'A.acol-stayman-weak');
  if (S >= 5 && p <= 11) return R('2C', `${p} HCP with weak spades: 2♠ would be McKendrick, so go through 2♣ Stayman, then bid 2♠ to play unless partner shows spades.`, 'A.acol-stayman-weak');
  const six = [3, 2].find(s => l[s] >= 6), five = [3, 2].find(s => l[s] === 5);
  if (p >= 12 && six !== undefined) return R(B(4, six), `${p} HCP with ${NUM[l[six]]} ${SN[six]}: 4${SY[six]}.`, 'A.acol-major-game');
  if (p >= 12 && five !== undefined) return R(B(3, five), `${p} HCP with five ${SN[five]}: 3${SY[five]} (forcing). Partner bids 4${SY[five]} with three, else 3NT.`, 'A.acol-major-3');
  if (p >= 11 && (H === 4 || S === 4)) return R('2C', `${p} HCP with a four-card major: 2♣ Stayman (11+).`, 'A.acol-stayman');
  if (p <= 11 && (H >= 5 || l[1] >= 5) && !SYS.transfers) { const s = H >= 5 ? 2 : 1; return R(B(2, s), `${p} HCP (0-11) with ${NUM[l[s]]} ${SN[s]}: 2${SY[s]}, to play.`, 'A.acol-weak-suit'); }
  if (p <= 10 && l[0] >= 6) return R('2S', `${p} HCP with ${NUM[l[0]]} clubs: 2♠ (McKendrick, or a weak long minor), then 3♣ to play.`, 'A.acol-weak-minor');
  const m6 = [0, 1].find(s => l[s] >= 6);
  if (p >= 12 && m6 !== undefined) return p >= 16 ? R(B(5, m6), `${p} HCP with ${NUM[l[m6]]} ${SN[m6]}: 5${SY[m6]}.`, 'A.acol-minor-game') : R('3N', `${p} HCP with ${NUM[l[m6]]} ${SN[m6]}: 3NT (12-15).`, 'A.acol-minor-game');
  if (p <= 10) return R('P', `${p} HCP: 0-10 passes 1NT (12-14).`, 'A.acol-pass');
  if (p === 11) return R('2S', `11 HCP, no major to show: 2♠ McKendrick asks partner's range. Partner bids 2NT with 12-13, 3♣ with 14.`, 'A.acol-mckendrick');
  if (p === 12) return R('2N', `12 HCP: 2NT invites. Partner passes with 12, bids 3NT with 13-14.`, 'A.acol-2nt');
  if (p >= 21) return R('6N', `${p} HCP: 33+ between you, 6NT.`, 'A.acol-3nt');
  if (p >= 19) return R('4N', `${p} HCP: 4NT, quantitative. Partner bids 6NT with 14, otherwise passes.`, 'A.acol-3nt');
  return R('3N', `${p} HCP (13+): 3NT.`, 'A.acol-3nt');
}
function acolAfter1NT(seq, h) {
  const n = seq.length, p = hcp(h), l = L(h), r = seq[1];
  if (n === 1) return acolR1NT(h);
  const tM = SYS.transfers ? (r === '2D' ? 2 : r === '2H' ? 3 : -1) : -1;
  if (tM >= 0) {
    if (n === 2) return R(B(2, tM), `Partner's ${plain(r)} is a transfer: complete it, 2${SY[tM]}.`, 'A.acol-transfer-complete');
    if (n === 3) {
      const k = losers(h), t = l[tM];
      if (p >= 12 || k <= 6) return t >= 6 ? R(B(4, tM), `${p} HCP${p < 12 ? ` but only ${k} losers` : ''} with ${NUM[t]} ${SN[tM]}: game, 4${SY[tM]}.`, 'A.acol-transfer-continue') : R('3N', `${p} HCP${p < 12 ? ` but only ${k} losers` : ''} with five ${SN[tM]}: 3NT, offering the choice. Partner bids 4${SY[tM]} with three.`, 'A.acol-transfer-continue');
      if (p === 11) return t >= 6 ? R(B(3, tM), `11 HCP with ${NUM[t]} ${SN[tM]}: invite with 3${SY[tM]}.`, 'A.acol-transfer-continue') : R('2N', `11 HCP with five ${SN[tM]}: invite with 2NT.`, 'A.acol-transfer-continue');
      return R('P', `${p} HCP: pass 2${SY[tM]}.`, 'A.acol-transfer-continue');
    }
    if (n === 4) {
      const b = seq[3];
      if (b === '2N') return l[tM] >= 3 ? (p >= 13 ? R(B(4, tM), `Partner's 2NT invites with five ${SN[tM]}. With ${l[tM]} and ${p} (13-14), 4${SY[tM]}.`, 'A.acol-transfer-answer') : R(B(3, tM), `Partner's 2NT invites with five ${SN[tM]}. With ${l[tM]} but 12, 3${SY[tM]}.`, 'A.acol-transfer-answer')) : p >= 13 ? R('3N', `Partner's 2NT invites. With ${p} (13-14) and two ${SN[tM]}, 3NT.`, 'A.acol-transfer-answer') : R('P', `Partner's 2NT invites. With 12, pass.`, 'A.acol-transfer-answer');
      if (b === B(3, tM)) return p >= 13 ? R(B(4, tM), `Partner's 3${SY[tM]} invites with six. With ${p} (13-14), 4${SY[tM]}.`, 'A.acol-transfer-answer') : R('P', `Partner's 3${SY[tM]} invites. With 12, pass.`, 'A.acol-transfer-answer');
      if (b === '3N') return l[tM] >= 3 ? R(B(4, tM), `Partner shows five ${SN[tM]} and game values. With ${l[tM]}, 4${SY[tM]}.`, 'A.acol-transfer-answer') : R('P', `Partner shows five ${SN[tM]}. With only ${l[tM]}, pass 3NT.`, 'A.acol-transfer-answer');
      return AP('Partner chose the contract.');
    }
    return AP('The contract is set.');
  }
  if (n === 2) {   // opener
    if (r === '2C') return stayAns(h);
    if (r === '2S') return p <= 13 ? R('2N', `McKendrick: ${p} HCP (12-13), 2NT.`, 'A.acol-mckendrick-answer') : R('3C', `McKendrick: 14 HCP, 3♣.`, 'A.acol-mckendrick-answer');
    if (r === '2N') return p >= 13 ? R('3N', `Partner invites with 2NT. With ${p} (13-14), accept: 3NT.`, 'A.acol-invite-answer') : R('P', `Partner invites with 2NT. With 12, pass.`, 'A.acol-invite-answer');
    if (r === '3H' || r === '3S') { const M = ST.indexOf(r[1]); return l[M] >= 3 ? R(B(4, M), `Partner's ${plain(r)} shows five ${SN[M]}. With ${l[M]}, bid 4${SY[M]}.`, 'A.acol-major-3-answer') : R('3N', `Partner's ${plain(r)} shows five ${SN[M]}. With only ${l[M]}, 3NT.`, 'A.acol-major-3-answer'); }
    if (r === '4N') return p >= 14 ? R('6N', `Partner's 4NT is quantitative. With 14, accept: 6NT.`, 'A.acol-invite-answer') : R('P', `Partner's 4NT is quantitative. With ${p}, pass.`, 'A.acol-invite-answer');
    return AP('Partner chose the contract.');
  }
  if (n === 3) {   // responder
    const a = seq[2];
    if (r === '2C') {
      const weak = p <= 10 || (p === 11 && Math.max(l[2], l[3]) >= 5 && Math.min(l[2], l[3]) >= 4) || (l[3] >= 5 && p <= 11);
      const M = a === '2H' ? 2 : a === '2S' ? 3 : -1;
      const k = losers(h), ltc = `you have ${k} losers, partner about 8: 24 − (${k} + 8) = ${24 - k - 8} tricks`;
      if (weak) {
        if (M >= 0 && l[M] >= 4) return k <= 6 ? R(B(4, M), `Partner showed ${SN[M]}, one of your suits. With a fit, shape counts: ${ltc}. Bid game: 4${SY[M]}.`, 'A.acol-stayman-continue') : R('P', `Partner showed ${SN[M]}, one of your suits: pass.`, 'A.acol-stayman-continue');
        const f = l[3] >= 5 ? 3 : 2;
        if (k <= 6) return l[f] >= 6 ? R(B(4, f), `Partner didn't show your ${SN[f]}, but opener has at least two: with your ${NUM[l[f]]} that's a fit, and ${ltc}. Bid game: 4${SY[f]}.`, 'A.acol-stayman-continue') : R(B(3, f), `Partner didn't show your ${SN[f]}. With only ${k} losers the hand is worth game: 3${SY[f]} (forcing), and partner bids 4${SY[f]} with three, else 3NT.`, 'A.acol-stayman-continue');
        return R(B(2, f), `Partner didn't show your ${SN[f]}: bid 2${SY[f]}, to play.`, 'A.acol-stayman-continue');
      }
      if (M >= 0 && l[M] >= 4) return p >= 13 || k <= 6 ? R(B(4, M), `A ${SN[M].replace(/s$/, '')} fit, and ${p >= 13 ? `${p} (13+)` : `${ltc}`}: 4${SY[M]}.`, 'A.acol-stayman-continue') : R(B(3, M), `A ${SN[M].replace(/s$/, '')} fit, ${p} HCP (11-12): invite with 3${SY[M]}.`, 'A.acol-stayman-continue');
      // After 2♥ without a heart fit you must hold four spades (Stayman promised a major). 2♠ here
      // would be the weak sign-off, so show the strength with no-trumps; opener with four spades bids them.
      if (a === '2H' && l[3] >= 4) return p >= 13 ? R('3N', `No heart fit, so you hold the four spades: 3NT. Partner bids 4♠ with four spades too.`, 'A.acol-stayman-continue') : R('2N', `No heart fit, so you hold the four spades: invite with 2NT. Partner bids 3♠ or 4♠ with four spades, otherwise passes or bids 3NT.`, 'A.acol-stayman-continue');
      return p >= 13 ? R('3N', `No fit, ${p} HCP (13+): 3NT.`, 'A.acol-stayman-continue') : R('2N', `No fit, ${p} HCP (11-12): invite with 2NT.`, 'A.acol-stayman-continue');
    }
    if (r === '2S') {
      if (p === 11) return a === '2N' ? R('P', `Partner has 12-13: with 11, pass 2NT.`, 'A.acol-mckendrick-continue') : R('3N', `Partner has 14: with 11 that's 25, bid 3NT.`, 'A.acol-mckendrick-continue');
      if (l[1] >= 6 && l[1] > l[0]) return R('3D', `Weak with long diamonds: 3♦ to play.`, 'A.acol-mckendrick-continue');
      return a === '2N' ? R('3C', `Weak with long clubs: 3♣ to play.`, 'A.acol-mckendrick-continue') : R('P', `Weak with long clubs: pass 3♣.`, 'A.acol-mckendrick-continue');
    }
    return AP('Partner chose the contract.');
  }
  if (n === 4) {   // opener again
    const b = seq[3];
    if (r === '2C' && seq[2] === '2D' && /^3[HS]$/.test(b)) { const M = ST.indexOf(b[1]); return l[M] >= 3 ? R(B(4, M), `Partner's ${plain(b)} shows five ${SN[M]} and game values (on shape). With ${l[M]}, 4${SY[M]}.`, 'A.acol-invite-answer') : R('3N', `Partner's ${plain(b)} shows five ${SN[M]}. With only ${l[M]}, 3NT.`, 'A.acol-invite-answer'); }
    if (r === '2C' && /^3[HS]$/.test(b)) { const M = ST.indexOf(b[1]); return p >= 13 ? R(B(4, M), `Partner invites with ${plain(b)}. With ${p} (13-14), accept: 4${SY[M]}.`, 'A.acol-invite-answer') : R('P', `Partner invites. With 12, pass.`, 'A.acol-invite-answer'); }
    if (r === '2C' && b === '2N' && seq[2] === '2H' && l[3] >= 4) return p >= 13 ? R('4S', `Partner's 2NT after your 2♥ shows four spades and 11-12. You have four spades too, and ${p} (13-14): 4♠.`, 'A.acol-invite-answer') : R('3S', `Partner's 2NT after your 2♥ shows four spades and 11-12. You have four spades too but 12: 3♠, no further.`, 'A.acol-invite-answer');
    if (r === '2C' && b === '2N') return p >= 13 ? R('3N', `Partner invites with 2NT. With ${p} (13-14), 3NT.`, 'A.acol-invite-answer') : R('P', `Partner invites with 2NT. With 12, pass.`, 'A.acol-invite-answer');
    if (r === '2C' && b === '3N' && seq[2] === '2H' && l[3] >= 4) return R('4S', `Partner's 3NT after your 2♥ shows four spades and game values. You have four spades too: 4♠.`, 'A.acol-invite-answer');
    if (r === '2C' && b === '2S' && seq[2] === '2H') return R('P', `Partner's 2♠ is the weak sign-off (weak spades go through Stayman): pass.`, 'A.acol-invite-answer');
    return AP('Partner chose the contract.');
  }
  return AP('The contract is set.');
}

// ---------- B: responses to a suit opening ----------
function acolR1(h, o) {
  const p = hcp(h), l = L(h), t = l[o], bal = isBal(h), fitM = t >= 4 && o >= 2;
  // The chart: "HCP → losers is approximate: count real losers when shape is unusual". So losers
  // only overrule points with a singleton or void, or five trumps.
  const odd = l.some(n => n <= 1) || t >= 5, k = odd ? losers(h) : 99;
  // Four-card support for a major: losers decide the raise as much as points (the chart's loser
  // table: 9 losers 2M · 8 3M · 7 4M · 6 or fewer, like 16+, a new suit first, then support).
  // Shape counts: 4-5 HCP with 9 losers or fewer, or any hand with a 5+ suit and 7 losers or fewer, responds.
  const lz = losers(h), bigShape = Math.max(...l) >= 5 && lz <= 7;
  const sh = shapeResp(h) || (fitM && p <= 5 && lz <= 9) || (p <= 5 && bigShape), sw = p <= 5 && sh ? shapeWhy(h) : '';
  if (p <= 5 && !sh) return R('P', `${p} HCP: a response needs 6+ (or fewer with real shape: 9 losers or fewer). Pass.`, 'B.acol-pass');
  const pe = Math.max(p, sh ? 6 : 0);
  // Jacoby 2NT (the switch, on by default): 4+ trumps and game values, 13+ HCP or 6 losers or fewer with 10+.
  if (SYS.jacoby && fitM && (pe >= 13 || (k <= 6 && p >= 10))) return R('2N', `${t}-card support and ${p} HCP${pe < 13 ? ` with only ${k} losers` : ''}: Jacoby 2NT, a game-forcing raise. Opener shows a short suit, or describes strength.`, 'B.acol-jacoby');
  if (fitM && pe < 16 && k > 6) {
    const byP = pe <= 9 ? 2 : pe <= 12 ? 3 : 4, byL = p <= 5 ? 2 : k <= 7 ? 4 : k <= 8 ? 3 : 2, lv = Math.max(byP, byL);
    const rng = ['', '', '6-9', '10-12', '13-15'][lv];
    const why = lv > byP ? `${t}-card support and ${p} HCP, but only ${k} losers (${loserBreak(h)}): with a fit, shape counts, and ${k} losers raise like ${rng}: ${plain(B(lv, o))}.` : `${sw}${t}-card support, ${p} HCP: raise to ${lv}${SY[o]} (${rng}).`;
    return R(B(lv, o), why, 'B.acol-raise');
  }
  // A big fit and few losers but not the points to plan a slam: bid game straight away.
  if (fitM && pe < 10 && k <= 6) return R(B(4, o), `${t}-card support and ${p} HCP, but only ${k} losers (${loserBreak(h)}): with a fit, shape counts. Bid game: 4${SY[o]}.`, 'B.acol-raise');
  if (t >= 4 && o < 2 && pe <= 12 && ![2, 3].some(s => l[s] >= 4)) return R(B(pe <= 9 ? 2 : 3, o), `${sw}${t}-card support for partner's ${SN[o]}, ${p} HCP: raise to ${pe <= 9 ? 2 : 3}${SY[o]} (${pe <= 9 ? '6-9' : '10-12'}).`, 'B.acol-raise');
  // A new suit: longest first; 5-5 the higher-ranking, 4-4 the lower. 1-level 6+, 2-level 9+.
  const others = [0, 1, 2, 3].filter(s => s !== o && l[s] >= 4);
  const one = others.filter(s => s > o);
  const strong16 = t >= 4 && (pe >= 16 || (fitM && k <= 6));
  const hearts2 = o === 3 && l[2] >= 4 && pe >= 10;   // never skip a four-card major: 2♥ rather than 2NT
  if (bal && !strong16 && !one.length && !hearts2) {
    if (pe <= 9) return R('1N', `${sw}${p} HCP, fairly balanced, no 4-card suit to show at the 1-level: 1NT (6-9).`, 'B.acol-1nt');
    if (pe <= 12 && SYS.jacoby && o >= 2) {
      const m = [0, 1, 2].filter(u => u !== o && l[u] >= 3).sort((a, b) => l[b] - l[a] || a - b)[0];
      const b = B(cheapest(m, B(1, o)), m);
      return R(b, `${p} HCP balanced: 2NT would be Jacoby, so bid a new suit, ${plain(b)} (${l[m] === 3 ? 'it may be only three cards' : 'natural'}), and show the 10-12 balanced next with 2NT.`, 'B.acol-new-suit');
    }
    if (pe <= 12) return R('2N', `${p} HCP balanced: 2NT (10-12).`, 'B.acol-2nt');
    if (pe <= 15) return R('3N', `${p} HCP balanced: 3NT (13-15).`, 'B.acol-3nt');
  }
  // 2-level: 9+, or 8 with a good six-card suit (7+ HCP and 6+ cards), or a 5+ suit with 7 losers or fewer.
  const twoOK = u => l[u] >= 6 && p >= 7 || (l[u] >= 5 && lz <= 7 && p >= 6);
  const pool = (pe >= 9 ? others : one.concat(others.filter(u => u < o && twoOK(u))));
  if (!pool.length) {
    if (pe <= 9) return R('1N', `${sw}${p} HCP and no suit to show at the 1-level: 1NT (6-9).`, 'B.acol-1nt');
    return bal ? R(pe <= 12 ? '2N' : '3N', `${p} HCP balanced: ${pe <= 12 ? '2NT (10-12)' : '3NT (13-15)'}.`, pe <= 12 ? 'B.acol-2nt' : 'B.acol-3nt') : gap('The chart has no response for this hand.');
  }
  const mx = Math.max(...pool.map(s => l[s])), tied = pool.filter(u => l[u] === mx);
  let s = mx >= 5 ? tied[tied.length - 1] : tied[0], how = tied.length > 1 ? (mx >= 5 ? ' (5-5: the higher-ranking)' : ' (equal length: the lower)') : '';
  // Never skip a four-card major over 1♣/1♦: bid it unless a longer minor and 10+ let you show both.
  const majs = pool.filter(u => u >= 2 && u > o);
  // (A 6-5 with the longer minor bids the minor first: with that shape you'll bid again.)
  if (o < 2 && s < 2 && majs.length && !(l[s] > Math.max(...majs.map(u => l[u])) && (pe >= 10 || (l[s] >= 6 && Math.max(...majs.map(u => l[u])) >= 5)))) {
    const mm = Math.max(...majs.map(u => l[u])), mt = majs.filter(u => l[u] === mm);
    s = mm >= 5 ? mt[mt.length - 1] : mt[0];
    how = l[s] < mx ? ` (never skip a four-card major: with ${p} HCP you may only get one bid, so show the major)` : mt.length > 1 ? (mm >= 5 ? ' (5-5: the higher-ranking)' : ' (4-4 majors: hearts first)') : ' (never skip a four-card major)';
  }
  const b = B(s > o ? 1 : 2, s);
  return R(b, `${sw}${strong16 ? `${t}-card support and ${p} HCP${pe < 16 ? ` with only ${k} losers` : ''} (worth 16+): bid a new suit first, then support. ` : `${p} HCP: `}new suit, ${plain(b)}${how}. ${s > o ? '1-level needs 6+' : pe >= 9 ? '2-level needs 9+' : `The 2-level normally needs 9+, but ${l[s] >= 6 && p >= 7 ? `a six-card suit makes ${p} enough` : `with ${lz} losers the shape makes up for it`}`}; forcing.`, strong16 ? 'B.acol-new-suit-support' : 'B.acol-new-suit');
}

// ---------- C and D: opener's rebid ----------
// Between suits of equal length: a major before a minor; hearts before spades (up the line).
const pr = s => s >= 2 ? 13 - s : s;
function acolRebid(h, o, r) {
  const p = hcp(h), l = L(h), bal = isBal(h), rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1, rl = +r[0];
  const k = losers(h), lt = (pl, need) => `you have ${k} losers, partner about ${pl}: 24 − (${k} + ${pl}) = ${24 - k - pl} tricks`;
  // Raises of opener's suit. With a fit, losers count as well as points (the chart's loser table:
  // partner's 2-level raise is about 9 losers, 3-level 8, 4-level 7).
  if (rs === o) {
    const semi = h.every(x => x.length >= 2);   // no singleton or void: no-trumps are possible
    if (o >= 2) {
      if (rl === 2) return acolSlamTry(h, o, 6, "Partner's raise to 2 (6-9)", 9) || (p >= 19 || k <= 5 ? R(B(4, o), `Partner's raise shows 6-9. ${p >= 19 ? `With ${p} (19+)` : `With a fit, shape counts: ${lt(9)}`}: bid game.`, 'B.acol-after-raise') : p >= 16 || k === 6 ? R(B(3, o), `Partner's raise shows 6-9. With ${p >= 16 ? `${p} (16+)` : `${k} losers`}, try for game with 3${SY[o]}. Partner bids game with 8-9 (or 8 losers or fewer).`, 'B.acol-after-raise') : R('P', `Partner's raise shows 6-9. With ${p} and ${k} losers, pass.`, 'B.acol-after-raise'));
      if (rl === 3) return acolSlamTry(h, o, 10, "Partner's raise to 3 (10-12)", 8) || (p >= 14 || k <= 6 ? R(B(4, o), `Partner's raise shows 10-12. ${p >= 14 ? `With ${p} (14+)` : `With a fit, shape counts: ${lt(8)}`}: bid game.`, 'B.acol-after-raise') : R('P', `Partner's raise shows 10-12. With ${p} and ${k} losers, pass.`, 'B.acol-after-raise'));
      return acolSlamTry(h, o, 13, "Partner's raise to 4 (13-15)", 7) || AP('Partner bid game.');
    }
    // A minor fit: look for 3NT first; five of a minor needs 11 tricks.
    if (rl === 2) {
      if (p >= 19 && semi) return R('3N', `Partner's raise shows 6-9. With ${p} and no short suit, bid 3NT: nine tricks are easier than eleven.`, 'B.acol-after-raise');
      if (p >= 16 && semi) return R('2N', `Partner's raise shows 6-9. With ${p} and no short suit, invite 3NT with 2NT. Partner bids 3NT with 8-9, else 3${SY[o]}.`, 'B.acol-after-raise');
      if (p >= 16 || k <= 6) return R(B(3, o), `Partner's raise shows 6-9. With ${p >= 16 ? `${p} (16+)` : `${k} losers`} and a short suit, try for game with 3${SY[o]}. Partner bids 3NT with 8-9.`, 'B.acol-after-raise');
      return R('P', `Partner's raise shows 6-9. With ${p}, pass.`, 'B.acol-after-raise');
    }
    if (rl === 3) {
      if (!semi && k <= 5) return R(B(5, o), `Partner's raise shows 10-12. With a short suit, no-trumps are risky, and ${lt(8)}: bid 5${SY[o]}.`, 'B.acol-after-raise');
      return p >= 14 || k <= 6 ? R('3N', `Partner's raise shows 10-12. With ${p}${p < 14 ? ` and ${k} losers` : ' (14+)'}, bid 3NT: nine tricks are easier than eleven.`, 'B.acol-after-raise') : R('P', `Partner's raise shows 10-12. With ${p}, pass.`, 'B.acol-after-raise');
    }
    return AP('Partner bid game.');
  }
  if (r === '2N' && SYS.jacoby && o >= 2) {
    const sh = [0, 1, 2, 3].find(u => u !== o && l[u] <= 1);
    if (sh !== undefined) return R(B(3, sh), `Partner's Jacoby 2NT: 4+ ${SN[o]}, game forcing. Show your short suit: 3${SY[sh]} (singleton or void).`, 'B.acol-jacoby-answer');
    if (p >= 18) return R(B(3, o), `Partner's Jacoby 2NT. No short suit, ${p} HCP (18+): 3${SY[o]}, slam interest.`, 'B.acol-jacoby-answer');
    if (p >= 15) return R('3N', `Partner's Jacoby 2NT. No short suit, ${p} HCP (15-17): 3NT.`, 'B.acol-jacoby-answer');
    return R(B(4, o), `Partner's Jacoby 2NT. No short suit and a minimum (13-14): 4${SY[o]}.`, 'B.acol-jacoby-answer');
  }
  if (r === '2N') {
    const two = [0, 1, 2, 3].filter(t => t !== o && l[t] >= 5).sort((a, b) => b - a)[0];
    if (o >= 2 && l[o] >= 6) return R(B(4, o), `Partner's 2NT shows 10-12 balanced, so at least two ${SN[o]}: with your ${NUM[l[o]]}, that's an 8-card fit. Bid 4${SY[o]}.`, 'B.acol-after-2nt');
    if (two !== undefined) return R(B(3, two), `Partner's 2NT shows 10-12 balanced. You have ${NUM[l[o]]} ${SN[o]} and ${NUM[l[two]]} ${SN[two]}: show the second suit, 3${SY[two]} (forcing). Partner picks the game.`, 'B.acol-after-2nt');
    if (o >= 2 && l[o] === 5 && p >= 14) return R(B(3, o), `Partner's 2NT shows 10-12 balanced. With five ${SN[o]} and ${p}, bid 3${SY[o]} (forcing): partner bids 4${SY[o]} with three, else 3NT.`, 'B.acol-after-2nt');
    if (p >= 14 || bal) return R('3N', `Partner's 2NT shows 10-12 balanced. With ${p}${bal ? ' balanced' : ' (14+)'}, bid 3NT.`, 'B.acol-after-2nt');
    if (o < 2 && l[o] >= 6) return R(B(3, o), `Partner's 2NT shows 10-12. With 13 and ${NUM[l[o]]} ${SN[o]}, 3${SY[o]}, to play.`, 'B.acol-after-2nt');
    return R('P', `Partner's 2NT shows 10-12. With 13 unbalanced, pass.`, 'B.acol-after-2nt');
  }
  if (r === '3N') return o >= 2 && l[o] >= 6 && !bal ? R(B(4, o), `Partner's 3NT shows 13-15 balanced, so at least two ${SN[o]}. With ${NUM[l[o]]} ${SN[o]} and an unbalanced hand, 4${SY[o]} is the safer game.`, 'B.acol-after-3nt') : AP('Partner bid game.');
  const rlv = r === '1N' ? 1 : rl;
  // C: balanced 15-19 rebids no-trumps (raise partner's major with four).
  if (bal && !(rs >= 2 && l[rs] >= 4)) {
    if (r === '1N') return p >= 19 ? R('3N', `Partner's 1NT shows 6-9. Balanced 19: 3NT.`, 'C.acol-nt-rebid') : p >= 17 ? R('2N', `Partner's 1NT shows 6-9. Balanced ${p} (17-18): invite with 2NT.`, 'C.acol-nt-rebid') : R('P', `Partner's 1NT shows 6-9. Balanced ${p} (15-16): pass.`, 'C.acol-nt-rebid');
    if (rlv === 1) return p >= 19 ? R('3N', `Balanced 19 after a 1-level response: 3NT.`, 'C.acol-nt-rebid') : p >= 17 ? R('2N', `Balanced ${p} (17-18) after a 1-level response: 2NT.`, 'C.acol-nt-rebid') : R('1N', `Balanced ${p} (15-16) after a 1-level response: 1NT.`, 'C.acol-nt-rebid');
    return p >= 17 ? R('3N', `Balanced ${p} (17-19) after a 2-level response: 3NT.`, 'C.acol-nt-rebid') : R('2N', `Balanced ${p} (15-16) after a 2-level response: 2NT.`, 'C.acol-nt-rebid');
  }
  // D: unbalanced 13-22.
  const bar = B(2, o), sup = rs >= 0 && rs < 4 && l[rs] >= 4;
  if (p >= 19) {
    if (sup) return R(rs >= 2 ? B(4, rs) : '3N', `${p} HCP (19-22) with four ${SN[rs]}: bid game.`, 'D.acol-jump-shift');
    const s2 = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 4).sort((a, b) => l[b] - l[a])[0];
    if (s2 === undefined) return R(l[o] >= 6 && o >= 2 ? B(4, o) : '3N', `${p} HCP (19-22): bid game.`, 'D.acol-jump-shift');
    const cl = cheapest(s2, r), js = B(cl + 1 <= 3 ? cl + 1 : cl, s2);
    if (cl + 1 > 3) return R(js, `${p} HCP (19-22): show your second suit, ${plain(js)}. After a 2-level response a new suit at the 3-level is already game forcing, so don't jump past 3NT.`, 'D.acol-jump-shift');
    return R(js, `${p} HCP (19-22): jump shift, ${plain(js)}, game forcing.`, 'D.acol-jump-shift');
  }
  // A 6-5 or 5-5 hand shows its second five-card suit, even as a reverse: with 15-18, or with
  // 13-14 when the shape makes up the difference (5 losers or fewer). Rebid it next time to show five.
  const five = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 5).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (five !== undefined && !sup && (p >= 15 || losers(h) <= 5)) {
    const c0 = cheapest(five, r), rev = bv(B(c0, five)) > bv(bar), jmp = !rev && losers(h) <= 4 && c0 + 1 <= 3;
    const b = B(jmp ? c0 + 1 : c0, five);
    return R(b, `${p} HCP${p < 15 ? ` but only ${losers(h)} losers` : ''}, ${NUM[l[o]]} ${SN[o]} and ${NUM[l[five]]} ${SN[five]}: show the second suit, ${plain(b)}${rev ? ' (a reverse, forcing)' : jmp ? ` (a jump: with only ${losers(h)} losers this is worth game, so make it forcing)` : ''}. Bid ${SN[five]} again next time to show five.`, jmp ? 'D.acol-jump-shift' : 'D.acol-strong');
  }
  if (p >= 15) {
    if (sup) return R(B(rlv + 2, rs), `${p} HCP (15-18) with four ${SN[rs]}: double raise to ${plain(B(rlv + 2, rs))}.`, 'D.acol-strong');
    if (l[o] >= 6) return R(B(3, o), `${p} HCP (15-18) with ${NUM[l[o]]} ${SN[o]}: jump rebid, 3${SY[o]}.`, 'D.acol-strong');
    const s2 = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 4).sort((a, b) => l[b] - l[a] || pr(b) - pr(a))[0];
    if (s2 !== undefined) { const b = B(cheapest(s2, r), s2); return R(b, `${p} HCP (15-18): show your second suit, ${plain(b)}${bv(b) > bv(bar) ? ' (a reverse)' : ''}.`, 'D.acol-strong'); }
    return R(B(cheapest(o, r), o), `${p} HCP (15-18) with nothing else to show: rebid ${SN[o]}.`, 'D.acol-strong');
  }
  // Never skip a four-card major: after a 2-level response (9+) it can be shown at the 2-level
  // with a minimum. It's not a reverse in strength. A major comes before raising a minor.
  const mj = rl === 2 && rs >= 0 ? [2, 3].find(s => s !== o && s !== rs && l[s] >= 4 && cheapest(s, r) === 2) : undefined;
  if (mj !== undefined && (bv(B(2, mj)) > bv(bar) || (sup && rs < 2))) return R(B(2, mj), `13-14 with four ${SN[mj]}: never skip a four-card major. Partner's 2-level response shows 9+, so ${plain(B(2, mj))} doesn't promise extra strength here.`, 'D.acol-weak');
  if (sup) return R(B(rlv + 1, rs), `13-14 with four ${SN[rs]}: raise to ${plain(B(rlv + 1, rs))}.`, 'D.acol-weak');
  const s2 = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 4 && bv(B(cheapest(s, r), s)) < bv(bar)).sort((a, b) => l[b] - l[a] || pr(b) - pr(a))[0];
  if (s2 !== undefined) { const b = B(cheapest(s2, r), s2); return R(b, `13-14: show your second suit below the barrier, ${plain(b)}.`, 'D.acol-weak'); }
  if (l[o] >= 5) return R(B(cheapest(o, r), o), `13-14 with ${NUM[l[o]]} ${SN[o]}: rebid them, ${plain(B(cheapest(o, r), o))}.`, 'D.acol-weak');
  if (r === '1N') return R('P', `13-14 and partner's 1NT (6-9): pass.`, 'D.acol-weak');
  const nt = bv('1N') > bv(r) ? '1N' : '2N';
  return R(nt, `13-14 with nothing else to show: ${plain(nt)}.`, 'D.acol-weak');
}

// No fit, 11+ and no-trumps in view: 2NT/3NT only with the unbid suits stopped and no singleton in
// partner's suit; otherwise show a second 4+ suit (a new suit is forcing), so partner can pick the game.
function acolNoFitNT(h, x, used, p, why) {
  const l = L(h), unbid = [0, 1, 2, 3].filter(u => !used.includes(u));
  const ntOK = l.every(n => n >= 2) && unbid.every(u => stop(h, u));
  const nt = p >= 13 ? '3N' : '2N';
  if (ntOK) return R(nt, `${why}. With ${p} (${p >= 13 ? '13+' : '11-12'}) and ${unbid.length ? `${unbid.map(u => SN[u]).join(' and ')} stopped` : 'a balanced hand'}, ${p >= 13 ? '3NT' : '2NT invites'}.`, 'D.acol-after');
  const sec = unbid.filter(u => l[u] >= 4 && bv(B(cheapest(u, x), u)) < bv('3N')).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (sec !== undefined) {
    const b = B(cheapest(sec, x), sec), bad = unbid.filter(u => u !== sec && !stop(h, u));
    return R(b, `${why}. No-trumps doesn't suit this hand (${bad.length ? `no ${bad.map(u => SN[u].replace(/s$/, '')).join(' or ')} stopper` : `a singleton in partner's suit`}), so show your ${SN[sec]}: ${plain(b)}, forcing. Partner bids 3NT with ${bad.length ? `a ${bad.map(u => SN[u].replace(/s$/, '')).join('/')} stopper` : 'the unbid suits stopped'}, rebids a six-card suit, or supports you.`, 'D.acol-after');
  }
  return R(nt, `${why}. With ${p} and no second suit to show, ${p >= 13 ? '3NT' : '2NT invites'}.`, 'D.acol-after');
}
// Responder's second call.
function acolResp2(h, seq) {
  const p = hcp(h), l = L(h), o = ST.indexOf(seq[0][1]), r = seq[1], x = seq[2];
  const rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1, rl = +r[0], xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, xl = +x[0];
  const six = [3, 2].find(s => l[s] >= 6);
  // After opener's no-trump rebid (C).
  if (x === '1N' || x === '2N' || x === '3N') {
    const rng = x === '1N' ? '15-16' : x === '2N' ? (rl === 2 ? '15-16' : '17-18') : (rl === 2 ? '17-19' : '19'), lo = +rng.split('-')[0];
    const why = `Opener's ${plain(x)} shows balanced ${rng}.`;
    if (p + lo >= 33) return R('6N', `${why} With ${p} that's 33+: 6NT.`, 'C.acol-after-nt');
    if (x === '3N') return six !== undefined ? R(B(4, six), `${why} With ${NUM[l[six]]} ${SN[six]}, 4${SY[six]}.`, 'C.acol-after-nt') : R('P', `${why} Pass.`, 'C.acol-after-nt');
    const need = x === '1N' ? 10 : x === '2N' && rl === 1 ? 8 : 10;
    if (p >= need && six === undefined && rs >= 2 && l[rs] === 5) return R(B(3, rs), `${why} With ${p} and five ${SN[rs]}, bid 3${SY[rs]} (forcing): opener bids 4${SY[rs]} with three, else 3NT.`, 'C.acol-after-nt');
    if (p >= need) return R(six !== undefined ? B(4, six) : '3N', `${why} With ${p}, bid game.`, 'C.acol-after-nt');
    if (six !== undefined && (p >= need - 1 || losers(h) <= 7)) return R(B(4, six), `${why} Opener has at least two ${SN[six]}, so your ${NUM[l[six]]} make an 8-card fit. With a fit, shape counts: you have ${losers(h)} losers, opener about 6: 24 − (${losers(h)} + 6) = ${18 - losers(h)} tricks. Bid 4${SY[six]}.`, 'C.acol-after-nt');
    if (x === '1N' && p === 9) return R('2N', `${why} With 9, invite with 2NT.`, 'C.acol-after-nt');
    if (x === '1N' && six !== undefined) return R(B(2, six), `${why} With ${p} and ${NUM[l[six]]} ${SN[six]}, sign off in 2${SY[six]}.`, 'C.acol-after-nt');
    return R('P', `${why} With ${p}, pass.`, 'C.acol-after-nt');
  }
  if (gameBid(x)) return AP('Opener bid game.');
  const bar = B(2, o), game = s => s >= 2 ? B(4, s) : '3N';
  // Opener raised responder's suit.
  if (xs === rs && rs < 2 && xl < rl + 2) return p >= 12 ? R('3N', `Opener's raise shows 13-14 and four ${SN[rs]}. With ${p} (12+), try 3NT: nine tricks are easier than eleven.`, 'D.acol-after') : R('P', `Opener's raise shows 13-14. With ${p}, pass.`, 'D.acol-after');
  if (xs === rs) {
    const dbl = xl >= rl + 2;
    const gm = rs >= 2 || bv('3N') > bv(x) ? game(rs) : o >= 2 && l[o] >= 3 ? B(4, o) : B(5, rs);
    if (dbl) return p >= 10 ? R(gm, `Opener's double raise shows 15-18. With ${p} (10+), bid game: ${plain(gm)}.`, 'D.acol-after') : R('P', `Opener's double raise shows 15-18. With ${p}, pass.`, 'D.acol-after');
    return p >= 13 ? R(game(rs), `Opener's raise shows 13-14. With ${p} (13+), bid game.`, 'D.acol-after') : p >= 11 ? R(B(xl + 1, rs), `Opener's raise shows 13-14. With ${p} (11-12), invite.`, 'D.acol-after') : R('P', `Opener's raise shows 13-14. With ${p}, pass.`, 'D.acol-after');
  }
  const js = xs >= 0 && xs !== o && xs !== rs && xl === cheapest(xs, r) + 1;
  const majAfter2 = rl === 2 && xl === 2 && xs >= 2;   // a 4-card major shown after our 2-level response: 13+, not a reverse
  const rev = xs >= 0 && xs !== o && xs !== rs && !js && bv(x) > bv(bar) && !majAfter2;
  if (majAfter2 && xs !== o && xs !== rs) {
    if (l[xs] >= 4) return p >= 12 ? R(B(4, xs), `Opener's ${plain(x)} shows four ${SN[xs]} and 13+. With four of them and ${p} (12+), bid game.`, 'D.acol-after') : R(B(3, xs), `Opener's ${plain(x)} shows four ${SN[xs]} and 13+. With four of them and ${p} (9-11), invite: 3${SY[xs]}.`, 'D.acol-after');
    if (p >= 12) return R('3N', `Opener's ${plain(x)} shows four ${SN[xs]} and 13+. No fit, ${p} (12+): 3NT.`, 'D.acol-after');
    if (l[rs] >= 6) return R(B(3, rs), `Opener's ${plain(x)} shows four ${SN[xs]}. No fit; with ${NUM[l[rs]]} ${SN[rs]} and ${p}, rebid them: 3${SY[rs]}.`, 'D.acol-after');
    return R('2N', `Opener's ${plain(x)} shows four ${SN[xs]} and 13+. No fit; with ${p} (9-11), 2NT invites.`, 'D.acol-after');
  }
  if (js) {
    const fitS = l[xs] >= 4 ? xs : l[o] >= 3 ? o : -1;
    if (fitS >= 0) { const st = acolSlamTry(h, fitS, 19, "Opener's jump shift (19-22)", 4); if (st) return st; }
    const own = rs >= 2 && l[rs] >= 6 ? rs : [3, 2].find(u => u !== o && u !== xs && l[u] >= 6);
    if (fitS < 0 && own !== undefined && bv(B(cheapest(own, x), own)) < bv('4C')) { const b = B(cheapest(own, x), own); return R(b, `Opener's jump shift is game forcing. Show your ${NUM[l[own]]} ${SN[own]}: ${plain(b)}. Opener raises with two or more, otherwise bids 3NT.`, 'D.acol-after'); }
    if (l[xs] >= 4 && xs >= 2) return R(B(4, xs), `Opener's jump shift is game forcing (19-22). With ${l[xs]} ${SN[xs]}, support: 4${SY[xs]}.`, 'D.acol-after');
    if (l[xs] >= 4 && h.some(t => t.length <= 1) && !(l[o] >= 3 && o >= 2)) return R(B(5, xs), `Opener's jump shift is game forcing (19-22). With ${l[xs]} ${SN[xs]} and a short suit, 5${SY[xs]}.`, 'D.acol-after');
    if (l[o] >= 3 && o >= 2) return R(B(4, o), `Opener's jump shift is game forcing. With ${l[o]} ${SN[o]}, 4${SY[o]}.`, 'D.acol-after');
    return R(bv('3N') > bv(x) ? '3N' : (o >= 2 ? B(4, o) : '3N'), `Opener's jump shift is game forcing: never pass. Bid game.`, 'D.acol-after');
  }
  if (rev) {
    const fit = (l[xs] >= 4 && xs) || (l[o] >= 3 && o);
    if (p >= 10) return R(l[xs] >= 4 && xs >= 2 ? B(4, xs) : l[o] >= 3 && o >= 2 ? B(4, o) : '3N', `Opener's reverse shows 15-18. With ${p} (10+), bid game.`, 'D.acol-after');
    if (l[xs] >= 4) return R(B(cheapest(xs, x), xs), `Opener's reverse is forcing. With ${p} (6-9) and four ${SN[xs]}, raise: ${plain(B(cheapest(xs, x), xs))}.`, 'D.acol-after');
    if (l[o] >= 2) return R(B(cheapest(o, x), o), `Opener's reverse is forcing. With ${p} (6-9), give preference: ${plain(B(cheapest(o, x), o))}.`, 'D.acol-after');
    return R(bv('2N') > bv(x) ? '2N' : '3N', `Opener's reverse is forcing: don't pass. With ${p}, ${bv('2N') > bv(x) ? '2NT' : '3NT'}.`, 'D.acol-after');
  }
  if (xs === o && xl === 3 && x === B(cheapest(o, r) + 1, o)) {   // jump rebid: 15-18, 6+ cards
    // Your own long major is still worth showing: 3M is forcing, opener raises with two.
    if (rs >= 2 && l[rs] >= 6 && l[o] <= 2 && (p >= 8 || losers(h) <= 6) && bv(B(3, rs)) > bv(x)) return R(B(3, rs), `Opener's jump rebid shows 15-18 with six ${SN[o]}. With ${NUM[l[rs]]} ${SN[rs]} of your own, bid 3${SY[rs]} (forcing): opener bids 4${SY[rs]} with two, else 3NT.`, 'D.acol-after');
    return p >= 10 ? R(l[o] >= 2 && o >= 2 ? B(4, o) : '3N', `Opener's jump rebid shows 15-18 with six. With ${p} (10+), bid game.`, 'D.acol-after') : R('P', `Opener's jump rebid shows 15-18. With ${p} (6-9), pass.`, 'D.acol-after');
  }
  // Never skip a four-card major: an unbid major at the 2-level with 10+ (forcing one round).
  const um = [2, 3].find(u => u !== o && u !== rs && u !== xs && l[u] >= 4 && cheapest(u, x) === 2);
  if (um !== undefined && p >= 10 && xs >= 0 && xs < 2 && !(l[xs] >= 4 && xs !== o) && bv(B(2, um)) > bv(x)) return R(B(2, um), `Opener's ${plain(x)} doesn't deny four ${SN[um]}. Never skip a four-card major: with ${p}, bid 2${SY[um]} (forcing one round).`, 'D.acol-after');
  // Your own six-card suit, and no fit for what opener has shown: rebid it.
  // A weak hand with a six-card minor, over partner's minor rebid: rebid it only when short (0-1) in
  // partner's suit; with a doubleton partner's long suit is as good a trump suit, so pass.
  const minorWeak = rs >= 0 && rs < 2 && p <= 10 && xs >= 0 && xs < 2;
  const ownSix = rs >= 0 && l[rs] >= 6 && l[o] <= (rs >= 2 ? 3 : minorWeak ? 1 : 2) && (xs === o || (xs >= 0 && l[xs] <= (minorWeak ? 1 : 3)));
  if (ownSix) {
    const lv = cheapest(rs, x), b = p >= 13 ? (rs >= 2 ? B(4, rs) : '3N') : p >= 11 && (rs >= 2 || lv + 1 <= 3) ? B(lv + 1, rs) : B(lv, rs);
    const jumped = /^\d/.test(b) && +b[0] > lv;
    return R(b, `No fit for opener (${cardsOf(l[xs], xs)}${xs !== o ? `, ${cardsOf(l[o], o)}` : ''}), and you have ${NUM[l[rs]]} ${SN[rs]}: ${p >= 13 ? `with ${p} (13+), bid game` : jumped ? `with ${p} (11-12), jump to invite` : `rebid them, to play`}: ${plain(b)}.`, 'D.acol-after');
  }
  // A long unbid suit of your own (6+), no fit and a weak hand: show it at the 2-level, to play.
  const un6 = [0, 1, 2, 3].find(u => u !== o && u !== rs && u !== xs && l[u] >= 6 && cheapest(u, x) === 2);
  if (un6 !== undefined && r === '1N' && p <= 10 && xs >= 0 && l[xs] <= 2 && l[o] <= 2) return R(B(2, un6), `No fit for opener (${cardsOf(l[o], o)}, ${cardsOf(l[xs], xs)}), but ${NUM[l[un6]]} ${SN[un6]}: bid 2${SY[un6]}, to play.`, 'D.acol-after');
  if (xs === o) {   // simple rebid of a 5+ suit: 13-14
    if (l[o] === 2 && rs >= 0 && rs < 2 && o < 2 && l[rs] >= 6 && p <= 10) return R('P', `Opener rebids ${SN[o]} (13-14, usually six). You have two of them and a weak hand: with a doubleton in partner's suit, ${SN[o]} is as good a trump suit as your ${SN[rs]}, so pass.`, 'D.acol-after');
    if (l[o] >= 3) return p >= 13 ? R(game(o), `Opener rebids ${SN[o]} (13-14). With ${l[o]} of them and ${p} (13+), bid game.`, 'D.acol-after') : p >= 11 ? R(B(3, o), `Opener rebids ${SN[o]}. With ${l[o]} of them and ${p} (11-12), invite: 3${SY[o]}.`, 'D.acol-after') : R('P', `Opener rebids ${SN[o]} (13-14). With ${p}, pass.`, 'D.acol-after');
    return p >= 11 ? acolNoFitNT(h, x, [o, rs], p, `Opener rebids ${SN[o]} (13-14)`) : R('P', `Opener rebids ${SN[o]}. With ${p}, pass.`, 'D.acol-after');
  }
  if (xs >= 0 && xs !== rs) {   // new suit below the barrier: 13-14
    const nw = `Opener's ${plain(x)} is a new suit, not a reverse (13-18, usually a minimum)`;
    if (l[xs] >= 4) return p >= 13 ? R(game(xs), `${nw}. With four ${SN[xs]} and ${p} (13+), bid game.`, 'D.acol-after') : p >= 11 ? R(B(xl + 1, xs), `${nw}. With four ${SN[xs]} and ${p} (11-12), invite.`, 'D.acol-after') : R('P', `${nw}. With four ${SN[xs]} and ${p}, pass.`, 'D.acol-after');
    if (p >= 11) return acolNoFitNT(h, x, [o, rs, xs], p, nw);
    if (l[o] >= l[xs] && l[o] >= 2) return R(B(cheapest(o, x), o), `${nw}. With ${p}, give preference: ${plain(B(cheapest(o, x), o))}.`, 'D.acol-after');
    return R('P', `${nw}. With ${p}, pass.`, 'D.acol-after');
  }
  return gap('The chart has no call here.');
}
// Opener's third call: answer invitations; otherwise pass.
function acolOpener3(h, seq) {
  const p = hcp(h), l = L(h), x = seq[2], a = seq[3], r = seq[1];
  if (gameBid(a) || a === '6N' || a === 'P') return AP('Partner chose the contract.');
  const as = /^\d[CDHS]$/.test(a) ? ST.indexOf(a[1]) : -1;
  const o = ST.indexOf(seq[0][1]), xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1, ls = losers(h);
  // Partner's 3M after our no-trump rebid shows five: raise with three.
  if (/N$/.test(x) && as === rs && as >= 2 && +a[0] === 3) return l[as] >= 3 ? R(B(4, as), `Partner's ${plain(a)} shows five ${SN[as]} and game values. With ${l[as]}, 4${SY[as]}.`, 'D.acol-opener-3') : R('3N', `Partner's ${plain(a)} shows five ${SN[as]}. With only ${l[as]}, 3NT.`, 'D.acol-opener-3');
  // Partner's own major after our jump rebid: forcing, raise with two.
  if (xs === o && +x[0] === 3 && as === rs && as >= 2 && +a[0] === 3) return l[as] >= 2 ? R(B(4, as), `Partner's ${plain(a)} shows six ${SN[as]} and is forcing. With ${l[as]}, 4${SY[as]}.`, 'D.acol-opener-3') : R('3N', `Partner's ${plain(a)} shows six ${SN[as]}. With a singleton, 3NT.`, 'D.acol-opener-3');
  // After our jump shift (game forcing), partner shows a long major: raise with two.
  if (xs >= 0 && xs !== o && +x[0] === cheapest(xs, r) + 1 && as >= 2 && as !== xs && as !== o && +a[0] === 3) return l[as] >= 2 ? R(B(4, as), `Partner's ${plain(a)} shows a long suit. With ${l[as]} ${SN[as]}, 4${SY[as]}.`, 'D.acol-opener-3') : R('3N', `Partner's ${plain(a)} shows a long suit. With a singleton, 3NT.`, 'D.acol-opener-3');
  // Partner's new suit after our minimum rebid (no fit for us yet): forcing. 3NT with the
  // unbid suit(s) stopped · six of our own suit: rebid it · support partner · else 3NT.
  if (as >= 0 && as !== o && as !== xs && as !== rs && +a[0] === 3 && (xs === o || bv(x) < bv(B(2, o)) || +x[0] <= 2)) {
    const unbid = [0, 1, 2, 3].filter(u => ![o, xs, rs, as].includes(u));
    if (unbid.every(u => stop(h, u))) return R('3N', `Partner's ${plain(a)} is forcing and suggests no stopper in ${unbid.map(u => SN[u]).join(' and ') || 'the unbid suit'}. You have it stopped: 3NT.`, 'D.acol-opener-3');
    if (l[o] >= 6 && o >= 2) return R(B(cheapest(o, a), o), `Partner's ${plain(a)} is forcing. No stopper in ${unbid.map(u => SN[u]).join(' and ')}, but six ${SN[o]}: ${plain(B(cheapest(o, a), o))}.`, 'D.acol-opener-3');
    if (rs >= 0 && l[rs] >= 3) { const b = B(cheapest(rs, a), rs); return R(b, `Partner's ${plain(a)} is forcing. No stopper in ${unbid.map(u => SN[u]).join(' and ')}; with ${l[rs]} ${SN[rs]}, show the support: ${plain(b)}.`, 'D.acol-opener-3'); }
    if (l[as] >= 4) { const b = B(cheapest(as, a), as); return R(b, `Partner's ${plain(a)} is forcing. With four ${SN[as]}, raise: ${plain(b)}.`, 'D.acol-opener-3'); }
    return R(l[o] >= 6 ? B(cheapest(o, a), o) : '3N', `Partner's ${plain(a)} is forcing. Nothing better to say: ${l[o] >= 6 ? `rebid your ${SN[o]}` : '3NT'}.`, 'D.acol-opener-3');
  }
  // Partner's new major at the 2-level (forcing one round).
  if (as >= 2 && as !== o && as !== xs && as !== rs && +a[0] === 2 && r !== '1N') {
    if (l[as] >= 4) return p >= 15 ? R(B(4, as), `Partner's ${plain(a)} shows four ${SN[as]}, 10+. You have four too and ${p}: 4${SY[as]}.`, 'D.acol-opener-3') : R(B(3, as), `Partner's ${plain(a)} shows four ${SN[as]}, 10+. You have four too, minimum: 3${SY[as]}.`, 'D.acol-opener-3');
    if (rs >= 2 && l[rs] >= 3 && bv(B(cheapest(rs, a), rs)) > bv(a)) { const b = B(cheapest(rs, a), rs); return R(b, `No four ${SN[as]}, but three ${SN[rs]}: show the support, ${plain(b)}.`, 'D.acol-opener-3'); }
    return p >= 15 ? R('3N', `No fit for ${SN[as]}. With ${p}, 3NT.`, 'D.acol-opener-3') : R('2N', `No fit for ${SN[as]}. With a minimum, 2NT.`, 'D.acol-opener-3');
  }
  // After our reverse, partner's simple preference shows 6-9 and a fit: with a two-suiter of
  // 4 losers or fewer, the shape is worth game.
  if (xs >= 0 && xs !== o && bv(x) > bv(B(2, o)) && (as === o || as === xs) && +a[0] === 3 && ls <= 4) {
    const g = as >= 2 ? B(4, as) : B(5, as);
    return R(g, `Partner's ${plain(a)} shows 6-9 and a ${SN[as]} fit. Your ${NUM[l[o]]}-${NUM[l[xs]]} shape has only ${ls} losers, so bid game: ${plain(g)}.`, 'D.acol-opener-3');
  }
  // Partner rebid their own suit without jumping: a sign-off.
  if (as === rs && as >= 0 && +a[0] === cheapest(rs, x) && !/N$/.test(x)) return R('P', `Partner's ${plain(a)} rebids their own suit without a jump: a sign-off. Pass.`, 'D.acol-opener-3');
  // After our reverse, partner's simple preference (6-9): game with 17+ (or 5 losers), otherwise stop.
  if (xs >= 0 && xs !== o && xs !== rs && bv(x) > bv(B(2, o)) && +x[0] === cheapest(xs, r) && (as === o || as === xs) && +a[0] === cheapest(as, x)) {
    const g = as >= 2 ? B(4, as) : '3N';
    return p >= 17 || ls <= 5 ? R(g, `Partner's ${plain(a)} is preference after your reverse (6-9). With ${p >= 17 ? `${p} (17+)` : `${ls} losers`}, bid game: ${plain(g)}.`, 'D.acol-opener-3') : R('P', `Partner's ${plain(a)} is preference after your reverse (6-9). With ${p}, stop here: pass.`, 'D.acol-opener-3');
  }
  if (a === '2N') { const need = x === '1N' ? 16 : 14; return p >= need ? R('3N', `Partner invites with 2NT. With ${p}, accept: 3NT.`, 'D.acol-opener-3') : R('P', `Partner invites with 2NT. With ${p}, pass.`, 'D.acol-opener-3'); }
  if (as >= 0 && +a[0] === 3) {
    const ok = p >= 14 || (as >= 2 && l[as] >= 4 && p >= 13) || (as >= 2 && l[as] >= 3 && ls <= 6);
    const g = as === rs && as >= 2 && l[as] < 2 ? '3N' : as >= 2 ? B(4, as) : '3N';
    return ok ? R(g, `Partner's ${plain(a)} invites. With ${p}${p < 14 ? ` and ${ls} losers` : ''}, accept: ${plain(g)}.`, 'D.acol-opener-3') : R('P', `Partner's ${plain(a)} invites. With ${p}, a minimum, pass.`, 'D.acol-opener-3');
  }
  return R('P', `Partner's ${plain(a)} is a sign-off or preference: pass.`, 'D.acol-opener-3');
}
// Responder's third call: after showing an unbid major at the 2-level.
function acolResp3(h, seq) {
  const p = hcp(h), l = L(h), o = ST.indexOf(seq[0][1]), r = seq[1], y = seq[3], z = seq[4];
  // After our forcing 3-level new suit (no stopper for no-trumps).
  if (/^3[CDHS]$/.test(y) && /^\d[CDHS]$/.test(r) && y[1] !== r[1] && y[1] !== seq[0][1] && y[1] !== seq[2][1]) {
    const rs = ST.indexOf(r[1]), ys = ST.indexOf(y[1]);
    if (gameBid(z) || z === 'P' || /^[56]/.test(z)) return AP('Partner chose the contract.');
    if (z[1] === seq[0][1]) return p >= 13 || (o >= 2 && l[o] >= 2) ? R(o >= 2 ? B(4, o) : B(5, o), `Opener shows six ${SN[o]}${l[o] >= 2 ? ` and you have ${l[o]}` : ''}: game, ${o >= 2 ? `4${SY[o]}` : `5${SY[o]}`}.`, 'D.acol-after') : R('P', `Opener rebids ${SN[o]} with no stopper for no-trumps. With ${p} and a singleton, stop: pass.`, 'D.acol-after');
    const zs = ST.indexOf(z[1]);
    if (zs === rs || zs === ys) { const g = zs >= 2 ? B(4, zs) : B(5, zs); return p >= 12 ? R(g, `Opener supports your ${SN[zs]}. With ${p}, game: ${plain(g)}.`, 'D.acol-after') : R('P', `Opener supports your ${SN[zs]}. With ${p}, stop here.`, 'D.acol-after'); }
    return AP('The contract is set.');
  }
  const rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1, ys = /^2[HS]$/.test(y) ? ST.indexOf(y[1]) : -1;
  if (ys < 0 || rs < 0 || gameBid(z) || z === 'P') return AP('The contract is set.');
  if (z === B(3, ys)) return p >= 12 ? R(B(4, ys), `Opener raised your ${SN[ys]} (13-14). With ${p} (12+), 4${SY[ys]}.`, 'D.acol-after') : R('P', `Opener raised your ${SN[ys]} with a minimum. With ${p}, pass.`, 'D.acol-after');
  if (z[1] === r[1]) return p >= 12 ? R(l[rs] >= 5 ? B(4, rs) : '3N', `Opener shows three ${SN[rs]}. With ${p} (12+), ${l[rs] >= 5 ? `4${SY[rs]}` : '3NT'}.`, 'D.acol-after') : R('P', `Opener shows three ${SN[rs]}. With ${p}, pass.`, 'D.acol-after');
  if (z === '2N') return p >= 12 ? R('3N', `Opener has no fit and a minimum. With ${p} (12+), 3NT.`, 'D.acol-after') : R('P', `Opener has no fit and a minimum. With ${p}, pass.`, 'D.acol-after');
  return AP('The contract is set.');
}
function acolAfter1Suit(seq, h) {
  const n = seq.length, o = ST.indexOf(seq[0][1]), r = seq[1];
  // Trumps for Blackwood: a suit both partners have bid before 4NT.
  const pre = seq.slice(0, seq.indexOf('4N') < 0 ? seq.length : seq.indexOf('4N'));
  const T = [3, 2, 1, 0].find(s => pre.some((c, i) => i % 2 === 0 && c[1] === ST[s] && /^\d/.test(c)) && pre.some((c, i) => i % 2 === 1 && c[1] === ST[s] && /^\d/.test(c)));
  // The asker knows the fit: a responder who bid a new suit planning to support opener plays in opener's suit.
  const i4 = seq.indexOf('4N'), mineAsk = i4 >= 0 && (seq.length - i4) % 2 === 0;   // I asked (my turn to decide)
  // Otherwise the suit partner bid in which I hold most cards (3+).
  const pSuits = pre.filter((c, j) => j % 2 !== i4 % 2 && /^\d[CDHS]$/.test(c)).map(c => ST.indexOf(c[1]));
  const pBest = pSuits.filter(u => L(h)[u] >= 3).sort((a, b) => L(h)[b] - L(h)[a])[0];
  const Tm = mineAsk && i4 % 2 === 1 && acolR1(h, o).id === 'B.acol-new-suit-support' ? o : T !== undefined ? T : mineAsk ? pBest : T;
  // Answering (aces or kings) doesn't depend on the trump suit; only the asker needs it.
  if (seq.includes('4N')) return !mineAsk ? acolBlackwood(seq, h, Tm !== undefined ? Tm : o) : Tm !== undefined ? acolBlackwood(seq, h, Tm) : AP('');
  if (n === 1) return acolR1(h, o);
  if (n === 2) return acolRebid(h, o, r);
  if (n === 3) {
    const x = seq[2], rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1;
    // Raised by opener after responder's 2M raise / 3M raise.
    if (rs === o) {
      const k = losers(h), g = o >= 2 ? B(4, o) : '3N';
      if (x === B(3, o) && +r[0] === 2) return hcp(h) >= 8 || (o >= 2 && k <= 8) ? R(g, `Opener's 3${SY[o]} is a game try (16+). With ${hcp(h) >= 8 ? `${hcp(h)} (8-9)` : `${k} losers`}, accept: ${plain(g)}${o < 2 ? ' (nine tricks rather than eleven)' : ''}.`, 'B.acol-after-raise') : R('P', `Opener's game try: with ${hcp(h)} (6-7) and ${k} losers, pass.`, 'B.acol-after-raise');
      if (x === '2N' && +r[0] === 2) return hcp(h) >= 8 ? R('3N', `Opener's 2NT invites 3NT (16-18 with no short suit). With ${hcp(h)} (8-9), accept: 3NT.`, 'B.acol-after-raise') : R(B(3, o), `Opener's 2NT invites 3NT. With ${hcp(h)} (6-7), sign off in 3${SY[o]}.`, 'B.acol-after-raise');
      return AP('Opener chose the contract.');
    }
    // 16+ with support: new suit, then support.
    const xs0 = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, strongX = x === '3N' || (x === '2N' && /^2/.test(r)) || (xs0 >= 0 && (+x[0] > cheapest(xs0, r) || (xs0 !== o && bv(x) > bv(B(2, o)))));
    if (acolR1(h, o).id === 'B.acol-new-suit-support') return acolSlamTry(h, o, strongX ? 15 : 13, strongX ? "Opener's strong rebid (15+)" : "Opener's opening (13+)", strongX ? 6 : 7) || R(o >= 2 ? B(4, o) : '3N', `You bid a new suit first with ${L(h)[o]}-card support and 16+: now support, game in ${o >= 2 ? SN[o] : 'no-trumps'}.`, 'B.acol-new-suit-support');
    // After our Jacoby 2NT: game, or Blackwood when the hands are worth slam.
    if (r === '2N' && SYS.jacoby && o >= 2) {
      const xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1;
      const [mp, pl, what] = x === B(4, o) ? [13, 7, 'a minimum (13-14)'] : x === '3N' ? [15, 6, '15-17'] : x === B(3, o) ? [18, 5, '18+'] : [13, 6, `a short ${SN[xs] ? SN[xs].replace(/s$/, '') : ''} suit`];
      const st = acolSlamTry(h, o, mp, `Opener's answer shows ${what}`, pl);
      if (st) return st;
      return x === B(4, o) ? AP('Opener bid game.') : R(B(4, o), `Opener's ${plain(x)} shows ${what}. No slam between you: 4${SY[o]}.`, 'B.acol-jacoby-continue');
    }
    // After our 2NT (10-12 balanced): opener's 3-level suit bid.
    if (r === '2N' && /^3[CDHS]$/.test(x)) {
      const xs = ST.indexOf(x[1]), l = L(h);
      if (xs === o && o < 2) return R('P', `Opener's 3${SY[o]} is a sign-off: pass.`, 'B.acol-after-2nt');
      if (o >= 2 && l[o] >= 3) return R(B(4, o), `Opener shows five ${SN[o]}${xs !== o ? ` and a second suit` : ''}. With ${l[o]} ${SN[o]}, 4${SY[o]}.`, 'B.acol-after-2nt');
      if (xs !== o && xs >= 2 && l[xs] >= 4) return R(B(4, xs), `Opener shows a second suit, ${SN[xs]}. With four of them, 4${SY[xs]}.`, 'B.acol-after-2nt');
      return R('3N', `Opener's ${plain(x)} looks for a fit. With no fit, 3NT.`, 'B.acol-after-2nt');
    }
    if (r === '2N' || r === '3N' || x === 'P' || gameBid(x)) return AP('Opener chose the contract.');
    return acolResp2(h, seq);
  }
  if (n === 4) return acolOpener3(h, seq);
  if (n === 5) return acolResp3(h, seq);
  return AP('The contract is set.');
}

// ---------- E: 2NT, weak twos, 2♣ ----------
function acolOver2NT(h, pm) {
  const p = hcp(h), l = L(h);
  if (p <= pm) return R('P', `${p} HCP: pass.`, 'E.acol-2nt-response');
  const six = [3, 2].find(s => l[s] >= 6), five = [3, 2].find(s => l[s] === 5);
  if (six !== undefined) return R(B(4, six), `${NUM[l[six]]} ${SN[six]}: 4${SY[six]}.`, 'E.acol-2nt-response');
  if (five !== undefined) return R(B(3, five), `Five ${SN[five]}: 3${SY[five]}. Partner bids 3NT, or 4${SY[five]} with three.`, 'E.acol-2nt-response');
  if (l[2] === 4 || l[3] === 4) return R('3C', `A four-card major: 3♣ Stayman.`, 'E.acol-2nt-response');
  return R('3N', `${p} HCP, balanced: 3NT.`, 'E.acol-2nt-response');
}
function acolAfter2NT(seq, h, pm) {
  const n = seq.length, l = L(h), r = seq[1];
  if (n === 1) return acolOver2NT(h, pm);
  if (n === 2) {
    if (r === '3C') return l[2] >= 4 ? R('3H', 'Stayman: four hearts, 3♥.', 'E.acol-2nt-answer') : l[3] >= 4 ? R('3S', 'Stayman: four spades, 3♠.', 'E.acol-2nt-answer') : R('3D', 'Stayman: no 4-card major, 3♦.', 'E.acol-2nt-answer');
    if (r === '3H' || r === '3S') { const M = ST.indexOf(r[1]); return l[M] >= 3 ? R(B(4, M), `Partner shows five ${SN[M]}: with ${l[M]}, 4${SY[M]}.`, 'E.acol-2nt-answer') : R('3N', `Partner shows five ${SN[M]}: with ${l[M]}, 3NT.`, 'E.acol-2nt-answer'); }
    return AP('Partner chose the contract.');
  }
  if (n === 3 && r === '3C') {
    const a = seq[2], M = a === '3H' ? 2 : a === '3S' ? 3 : -1;
    return M >= 0 && l[M] >= 4 ? R(B(4, M), `A ${SN[M].replace(/s$/, '')} fit: 4${SY[M]}.`, 'E.acol-2nt-continue') : R('3N', 'No fit: 3NT.', 'E.acol-2nt-continue');
  }
  return AP('Partner chose the contract.');
}
function acolAfter2C(seq, h) {
  const n = seq.length, p = hcp(h), l = L(h);
  if (n === 1) return over2C(h);
  if (seq[1] !== '2D') return after2CPositive(seq, h);
  if (n === 2) return twoClubRebid(h);
  const x = seq[2];
  if (x === '2N') return acolAfter2NT(seq.slice(2), h, 2);
  if (x === '3N') return AP('Partner bid game.');
  if (n === 3) {
    const s = ST.indexOf(x[1]);
    if (x === '2H' || x === '2S') {
      if (p <= 3) return R('2N', `Partner shows five ${SN[s]}. With 0-3, 2NT.`, 'E.acol-2c-continue');
      return l[s] >= 3 ? R(B(4, s), `Partner shows five ${SN[s]}. With ${l[s]} and 4+ HCP, 4${SY[s]}.`, 'E.acol-2c-continue') : R('3N', `Partner shows five ${SN[s]}. With only ${l[s]}, 3NT.`, 'E.acol-2c-continue');
    }
    const M = [3, 2].filter(u => l[u] >= 5).sort((a, b) => l[b] - l[a])[0];
    if (M !== undefined) return R(B(3, M), `Partner shows a long minor. You have ${NUM[l[M]]} ${SN[M]}: show them, 3${SY[M]}. Partner raises with three, otherwise bids 3NT.`, 'E.acol-2c-continue');
    return R('3N', `Partner shows a long minor. 3NT.`, 'E.acol-2c-continue');
  }
  if (n === 4 && /^3[CD]$/.test(x) && /^3[HS]$/.test(seq[3])) { const M = ST.indexOf(seq[3][1]); return l[M] >= 3 ? R(B(4, M), `Partner shows five or more ${SN[M]}. With ${l[M]}, 4${SY[M]}.`, 'E.acol-2c-continue') : R('3N', `Partner shows ${SN[M]}, but you have only ${l[M]}: 3NT.`, 'E.acol-2c-continue'); }
  if (n === 4 && seq[3] === '2N') { const s = ST.indexOf(x[1]); return l[s] >= 6 ? R(B(4, s), `Partner is weak (0-3). With six ${SN[s]}, 4${SY[s]}.`, 'E.acol-2c-continue') : R('3N', `Partner is weak (0-3): 3NT.`, 'E.acol-2c-continue'); }
  return AP('Partner chose the contract.');
}

// ---------- G: Blackwood ----------
// Once a fit is found and the two hands hold 31+, ask for aces with 4NT (5♣ 0/4, 5♦ 1, 5♥ 2,
// 5♠ 3); missing two: 5 of the suit; missing one: 6; all four: 5NT asks kings (6♣ 0/4 …).
const aces = h => [0, 1, 2, 3].filter(s => has(h, s, 14)).length;
// Slam: 31+ points between you, or (with a fit) the loser count says 12 tricks: 24 − (yours + partner's) ≥ 12.
// pl: partner's losers, estimated from their bids.
function acolSlamTry(h, T, minP, desc, pl) {
  const p = hcp(h), k = losers(h);
  if (p + minP >= 31) return R('4N', `${desc} shows at least ${minP}. With ${p} that's ${p + minP}+ between you and a ${SN[T]} fit: ask for aces with 4NT (Blackwood).`, 'G.acol-blackwood');
  if (pl && 24 - k - pl >= 12 && p + minP >= 25) return R('4N', `${desc}: a ${SN[T]} fit. Count losers: yours ${k} (${loserBreak(h)}), partner's about ${pl}. 24 − (${k} + ${pl}) = ${24 - k - pl} tricks, enough for slam if you're not missing two aces: ask with 4NT (Blackwood).`, 'G.acol-blackwood');
  return null;
}
function acolBlackwood(seq, h, T) {
  const i4 = seq.indexOf('4N'), k = seq.length - 1 - i4, a = aces(h);
  if (k === 0) { const b = ['5C', '5D', '5H', '5S', '5C'][a]; return R(b, `Aces: ${a}. ${plain(b)} shows ${a === 0 || a === 4 ? '0 or 4' : a}.`, 'G.acol-blackwood-answer'); }
  if (k === 1) {
    const rep = seq[i4 + 1], shown = { '5C': a >= 1 ? 0 : 4, '5D': 1, '5H': 2, '5S': 3 }[rep], tot = a + shown, miss = 4 - tot, five = B(5, T);
    const head = `You hold ${a} ace${a === 1 ? '' : 's'}, partner shows ${shown}: ${tot} of 4.`;
    if (miss >= 2) return bv(rep) < bv(five) ? R(five, `${head} Missing two: sign off in 5${SY[T]}.`, 'G.acol-blackwood-decide') : bv(rep) === bv(five) ? R('P', `${head} Missing two, and the reply is already 5${SY[T]}: pass.`, 'G.acol-blackwood-decide') : R(B(6, T), `${head} Missing two, but the reply is past 5${SY[T]}: 6${SY[T]}.`, 'G.acol-blackwood-decide');
    if (miss === 1) return R(B(6, T), `${head} Missing one: 6${SY[T]}.`, 'G.acol-blackwood-decide');
    return R('5N', `${head} All four aces: 5NT asks for kings.`, 'G.acol-blackwood-decide');
  }
  if (k === 2) {
    if (seq[i4 + 2] !== '5N') return AP('Partner placed the contract.');
    const kg = [0, 1, 2, 3].filter(s => has(h, s, 13)).length, b = ['6C', '6D', '6H', '6S', '6C'][kg];
    return R(b, `Kings: ${kg}. ${plain(b)} shows ${kg === 0 || kg === 4 ? '0 or 4' : kg}.`, 'G.acol-blackwood-answer');
  }
  if (k === 3) {
    const rep = seq[i4 + 3], mine = [0, 1, 2, 3].filter(s => has(h, s, 13)).length, shown = { '6C': mine >= 1 ? 0 : 4, '6D': 1, '6H': 2, '6S': 3 }[rep];
    const all = mine + shown === 4;
    if (all) return R(B(7, T), `All four aces and all four kings: bid the grand slam, 7${SY[T]}.`, 'G.acol-blackwood-decide');
    return bv(B(6, T)) > bv(rep) ? R(B(6, T), `A king is missing: 6${SY[T]}.`, 'G.acol-blackwood-decide') : R('P', `A king is missing: stay in 6${SY[T]}.`, 'G.acol-blackwood-decide');
  }
  return AP('The contract is set.');
}

// Partner's weak two, when you have a long suit of your own and little support: the chart's
// 2NT ask is for hands that may play in partner's suit. Returns null to use the chart's responses.
function acolWeakTwoResp(h, w) {
  const p = hcp(h), l = L(h), k = losers(h), gd = s => [14, 13, 12].filter(r => has(h, s, r)).length >= 2;
  // Four trumps and 14+: the fit is there, so bid game rather than ask.
  if (l[w] >= 4 && p >= 14) { const g = w >= 2 ? B(4, w) : B(5, w); return R(g, `Partner's weak two shows six ${SN[w]}; with your ${NUM[l[w]]} that's a ${6 + l[w]}-card fit, and ${p} HCP: bid game, ${plain(g)}. No need to ask.`, 'E.acol-weak-two-own-suit'); }
  const own = [3, 2].find(s => s !== w && l[s] >= 6 && gd(s));
  if (own !== undefined && l[w] <= 2 && (p >= 14 || k <= 5)) return R(B(4, own), `Partner's weak two shows 5-10 and six ${SN[w]}. You have ${l[w] ? `only ${cardsOf(l[w], w)}` : `a void in ${SN[w]}`} but ${NUM[l[own]]} good ${SN[own]} of your own and ${p >= 14 ? `${p} HCP` : `${k} losers`}: bid game in your suit, 4${SY[own]}.`, 'E.acol-weak-two-own-suit');
  if (l[w] === 0 && p >= 14) {
    const m = [1, 0].find(s => s !== w && l[s] >= 6 && gd(s));
    if (m !== undefined && p >= 16) return R('3N', `Partner's weak two shows six ${SN[w]}, and you have none: no point asking. With ${NUM[l[m]]} good ${SN[m]} and ${p}, 3NT.`, 'E.acol-weak-two-own-suit');
    return R('P', `Partner's weak two shows six ${SN[w]}, and you have none: a misfit. Don't ask with 2NT; pass and go quietly.`, 'E.acol-weak-two-own-suit');
  }
  return null;
}

// ---------- The uncontested dispatcher ----------
function acolSysCall(seq, h) {
  const n = seq.length;
  if (n === 0) return acolOpening(h);
  const o = seq[0];
  if (o === 'P') {
    if (n > 1) return gap('The chart has no passed-hand auctions.');
    const c = acolOpening(h);
    return isCall(c) && c.bid === 'P' ? c : gap('The chart has no auctions where one partner passes and the other then opens.');
  }
  if (n >= 2 && seq[n - 1] === 'P') return gap('The chart has no call after a pass.');
  if (o === '1N') return acolAfter1NT(seq, h);
  if (o === '2N') return acolAfter2NT(seq, h, 3);
  if (o === '2C') return acolAfter2C(seq, h);
  if (/^2[DHS]$/.test(o) && n === 2 && (gameBid(seq[1]) || seq[1] === '3N')) return AP('Partner chose the contract.');
  if (/^2[DHS]$/.test(o)) return (n === 1 && acolWeakTwoResp(h, ST.indexOf(o[1]))) || afterWeakTwo(seq, h);
  if (/^1[CDHS]$/.test(o)) return acolAfter1Suit(seq, h);
  if (/^[34][CDHS]$/.test(o)) return afterPreempt(seq, h);
  return gap('The chart has no auctions after this opening.');
}

// ---------- F and H: competitive ----------
function acolOvercall(h, x) {
  const p = hcp(h), l = L(h), bal = isBal(h), un = [0, 1, 2, 3].filter(s => s !== x);
  if (bal && p >= 16 && p <= 18 && stop(h, x)) return R('1N', `${p} HCP balanced with a ${SN[x]} stopper: 1NT overcall (16-18).`, 'F.acol-overcall');
  const best = un.filter(s => l[s] >= 5 && good(h, s)).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (best !== undefined && l[best] >= 6 && p >= 13 && p <= 16) { const b = B(cheapest(best, B(1, x)) + 1, best); return R(b, `${p} HCP with a good ${NUM[l[best]]}-card suit: jump overcall ${plain(b)} (strong, 13+).`, 'F.acol-overcall'); }
  if (best !== undefined) {
    const lv = best > x ? 1 : 2;
    if (lv === 1 && p >= 8 && p <= 15) return R(B(1, best), `${p} HCP with ${l[best]} good ${SN[best]}: 1${SY[best]} overcall (5+ good suit, 8+).`, 'F.acol-overcall');
    if (lv === 2 && l[best] >= 6 && p >= 10 && p <= 15) return R(B(2, best), `${p} HCP with ${NUM[l[best]]} good ${SN[best]}: 2${SY[best]} overcall (6+ good suit, 10+).`, 'F.acol-overcall');
  }
  if (p >= 12 && un.every(s => l[s] >= 3)) return R('X', `${p} HCP with 3+ cards in every unbid suit: takeout double.`, 'F.acol-takeout');
  if (p <= 11) return R('P', `${p} HCP with no good suit to overcall and not enough to double: pass.`, 'F.acol-overcall-pass');
  return gap('The chart has no call for this hand over the opening.');
}
function acolVs1NT(h) {
  const p = hcp(h), l = L(h);
  if (p >= 16) return R('X', `${p} HCP (16+) over their 12-14 1NT: double for penalties.`, 'H.acol-vs-1nt');
  const s = [3, 2, 1, 0].find(u => l[u] >= 6 && good(h, u));
  if (s !== undefined && p >= 10) return R(B(2, s), `${p} HCP with a good ${NUM[l[s]]}-card ${SN[s].replace(/s$/, '')} suit: overcall 2${SY[s]}.`, 'H.acol-vs-1nt');
  return R('P', `${p} HCP and no good six-card suit: pass their 1NT.`, 'H.acol-vs-1nt');
}
function acolAdvance(h, x) {
  const p = hcp(h), l = L(h), un = [0, 1, 2, 3].filter(s => s !== x);
  const mx = Math.max(...un.map(s => l[s]));
  let s = un.filter(u => l[u] === mx).sort((a, b) => b - a)[0];
  // A four-card (or longer) major comes before a longer minor: the double promised the majors.
  const mj = un.filter(u => u >= 2 && l[u] >= 4).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (s < 2 && mj !== undefined) s = mj;
  const what = l[s] < mx ? `your best suit, and a major comes first: ${NUM[l[s]]} ${SN[s]}` : `your longest suit, ${SN[s]}`;
  if (p >= 12) { const g = s >= 2 ? B(4, s) : stop(h, x) ? '3N' : B(5, s); return R(g, `Partner's double asks for ${what}. With ${p} (12+), bid game: ${plain(g)}.`, 'F.acol-advance'); }
  const b = B(cheapest(s, B(1, x)) + (p >= 9 ? 1 : 0), s);
  return R(b, `Partner's double asks for ${what}. With ${p} (${p >= 9 ? '9-11: jump' : '0-8: cheapest'}), ${plain(b)}. Don't pass.`, 'F.acol-advance');
}
function acolAfterOvercall(h, ov) {
  const p = hcp(h), l = L(h), y = ST.indexOf(ov[1]), lv = +ov[0], t = l[y], jump = false;
  if (t >= 3 && p >= 6) {
    const b = p >= 13 ? B(y >= 2 ? 4 : 5, y) : p >= 11 ? B(lv + 2, y) : B(lv + 1, y);
    return R(b, `Partner overcalled ${plain(ov)}. With ${t}-card support and ${p} HCP, raise: ${plain(b)}.`, 'F.acol-advance-overcall');
  }
  const own = [3, 2, 1, 0].find(s => s !== y && l[s] >= 6 && p >= 8);
  if (own !== undefined) { const b = B(cheapest(own, ov), own); return R(b, `Partner overcalled ${plain(ov)}. You have a longer suit, ${NUM[l[own]]} ${SN[own]}: ${plain(b)}.`, 'F.acol-advance-overcall'); }
  return R('P', `Partner overcalled ${plain(ov)}. With ${cardsOf(t, y)} and no longer suit, pass.`, 'F.acol-advance-overcall');
}
// Partner opened; RHO overcalled or doubled: bid as you would have done, ignoring it.
function acolIgnore(h, o, last) {
  const c = acolR1(h, o);
  if (!isCall(c)) return c;
  if (c.bid === 'P') return R('P', `${c.why} (The interference changes nothing.)`, 'F.acol-ignore');
  if (c.id === 'B.acol-jacoby') return R(B(4, o), `With RHO in the auction, skip Jacoby and bid game: 4${SY[o]} (${L(h)[o]} trumps, ${hcp(h)} HCP).`, 'F.acol-ignore');
  if (last === 'X') return R(c.bid, `RHO's double changes nothing: ${c.why}`, 'F.acol-ignore');
  const y = ST.indexOf(last[1]);
  // The suit you would have bid is the one they overcalled: you can't bid it naturally now. Your
  // length there is a stopper, so show the strength in no-trumps (or pass).
  if (/^\d[CDHS]$/.test(c.bid) && ST.indexOf(c.bid[1]) === y) {
    const p = hcp(h), l = L(h), nt = p >= 13 ? '3N' : p >= 10 ? '2N' : '1N';
    // Another suit to show instead (5+ cards, or 4 at the 1-level).
    const alt = [3, 2, 1, 0].filter(u => u !== y && u !== o && (l[u] >= 5 || (l[u] >= 4 && cheapest(u, last) === 1))).sort((a, b) => l[b] - l[a] || b - a)
      .find(u => cheapest(u, last) === 1 || p >= 9 || (l[u] >= 5 && losers(h) <= 7));
    if (alt !== undefined) { const b = B(cheapest(alt, last), alt); return R(b, `You would have bid ${plain(c.bid)}, but that's the suit RHO overcalled. Show your other suit instead: ${plain(b)}${b[0] === '2' && p < 9 ? ` (the 2-level needs 9+, but your shape, ${losers(h)} losers, makes up for it)` : ''}.`, 'F.acol-ignore'); }
    if (!stop(h, y) || bv(nt) <= bv(last)) return R('P', `You would have bid ${plain(c.bid)}, but that's the suit RHO overcalled. Pass for now: your ${SN[y]} may defend well.`, 'F.acol-ignore');
    return R(nt, `You would have bid ${plain(c.bid)}, but RHO has bid ${SN[y]}. Your ${SN[y]} make a good stopper, so show your ${p} HCP in no-trumps: ${plain(nt)} (${nt === '1N' ? '6-9' : nt === '2N' ? '10-12' : '13-15'}).`, 'F.acol-ignore');
  }
  if (c.bid[1] === 'N') {
    if (!stop(h, y)) return R('P', `You would have bid ${plain(c.bid)}, but no-trumps needs a good ${SN[y]} stopper: pass.`, 'F.acol-ignore');
    const b = bv(c.bid) > bv(last) ? c.bid : (+c.bid[0] + 1) + 'N';
    return R(b, `RHO's ${plain(last)} changes little: with a ${SN[y]} stopper, ${plain(b)}.`, 'F.acol-ignore');
  }
  if (bv(c.bid) > bv(last)) return R(c.bid, `Ignore RHO's ${plain(last)}: ${c.why}`, 'F.acol-ignore');
  const s = ST.indexOf(c.bid[1]), b = B(cheapest(s, last), s);
  const shape = L(h)[s] >= 5 && losers(h) <= 7;   // shape makes up for points
  if (+b[0] - +c.bid[0] >= 1 && hcp(h) < 9 && s !== o && !shape) return R('P', `You would have bid ${plain(c.bid)}, but now it needs the ${b[0]}-level (9+): pass.`, 'F.acol-ignore');
  if (+b[0] - +c.bid[0] >= 1 && hcp(h) < 9 && s !== o) return R(b, `You would have bid ${plain(c.bid)}. It now needs the ${b[0]}-level (9+), but with ${NUM[L(h)[s]]} ${SN[s]} and only ${losers(h)} losers the shape makes up for the points: ${plain(b)}.`, 'F.acol-ignore');
  return R(b, `Ignore RHO's ${plain(last)}: bid ${plain(b)} as you would have done.`, 'F.acol-ignore');
}
// Our 1NT doubled, by the Acol chart: responder signs off in a 5+ card ♦/♥/♠ suit or passes;
// opener passes. role 'o' = the 1NT opener, 'r' = responder; calls start with our 1NT.
function acolNTDoubled(role, h, calls) {
  const n = calls.length;
  if (role === 'r' && n === 2) {
    const l = L(h), s = [1, 2, 3].filter(u => l[u] >= 5).sort((a, b) => l[b] - l[a])[0];
    return s !== undefined ? R(B(2, s), `Our 1NT is doubled. With ${l[s]} ${SN[s]}, sign off in 2${SY[s]}.`, 'H.acol-1nt-doubled') : R('P', `Our 1NT is doubled, and you have no five-card suit to run to: pass.`, 'H.acol-1nt-doubled');
  }
  if (role === 'o' && n === 4 && calls[2] !== 'P') return R('P', `Partner's call is final: pass.`, 'H.acol-1nt-doubled');
  return AP('');
}
function acolCompetitive(st, h) {
  const { tagged, seat, partner, lho, rho } = st;
  {
    // Our 1NT doubled: the chart's sign-off, or Helvic Wriggle when that option is on.
    const i = tagged.findIndex(x => x.call !== 'P'), a = tagged[i], b = tagged[i + 1];
    if (a && a.call === '1N' && (a.by === seat || a.by === partner) && b && b.call === 'X') {
      const calls = tagged.slice(i).map(x => x.call), role = a.by === seat ? 'o' : 'r';
      return SYS.helvic ? ntDoubledCall(role, h, calls, true) : acolNTDoubled(role, h, calls);
    }
  }
  if (tagged.some(x => x.by === seat)) {
    return gap('Once the opponents have bid, the chart covers only the first call over them.');
  }
  const bids = tagged.filter(x => x.call !== 'P'), open = bids[0], last = tagged[tagged.length - 1];
  const oneSuit = c => /^1[CDHS]$/.test(c), suit = c => ST.indexOf(c[1]);
  if (bids.length === 1 && open.by === rho && last === open) {
    if (open.call === '1N') return acolVs1NT(h);
    if (oneSuit(open.call)) return acolOvercall(h, suit(open.call));
    if (/^[34][CDHS]$/.test(open.call)) {
      const p = hcp(h), l = L(h), x = suit(open.call), un = [0, 1, 2, 3].filter(s => s !== x);
      if (p < 12) return R('P', `${p} HCP over a pre-empt: pass (12+ to act).`, 'H.acol-vs-preempt');
      const s = un.filter(u => l[u] >= 6).sort((a, b) => l[b] - l[a] || b - a)[0];   // equal length: the higher-ranking
      if (s !== undefined) {
        const k = losers(h), big = s >= 2 && k <= 5;
        const b = B(l[s] >= 7 || big ? Math.max(4, cheapest(s, open.call)) : cheapest(s, open.call), s);
        return R(b, `${p} HCP with ${NUM[l[s]]} ${SN[s]}${big && l[s] < 7 ? ` and only ${k} losers: bid game` : ''}: ${plain(b)}.`, 'H.acol-vs-preempt');
      }
      if (un.every(u => l[u] >= 3)) return R('X', `${p} HCP with 3+ in every unbid suit: takeout double.`, 'H.acol-vs-preempt');
      return R('P', `No long suit and no takeout shape: pass.`, 'H.acol-vs-preempt');
    }
  }
  if (bids.length === 2 && open.by === partner && oneSuit(open.call) && bids[1].by === rho && last === bids[1] && (oneSuit(bids[1].call) || bids[1].call === 'X' || /^2[CDHS]$/.test(bids[1].call))) return acolIgnore(h, suit(open.call), bids[1].call);
  if (bids.length === 2 && open.by === lho && oneSuit(open.call) && bids[1].by === partner && bids[1].call === 'X' && last.by === rho && last.call === 'P') return acolAdvance(h, suit(open.call));
  if (bids.length === 2 && open.by === lho && oneSuit(open.call) && bids[1].by === partner && /^[12][CDHS]$/.test(bids[1].call) && last.by === rho && last.call === 'P') return acolAfterOvercall(h, bids[1].call);
  return gap('The chart has no call for this contested auction.');
}

// ---------- Acol drills ----------
// Same machinery as drills.js; buildSet switches the rules to Acol for sets marked acol: true.
const ACOL_SETS = (() => {
  const ub = h => !isBal(h);
  const NTa = { north: { lens: 'bal', hcp: [12, 14], opens: '1N' }, note: 'Partner opened 1NT (12-14).' };
  const NT2a = { north: { lens: 'bal', hcp: [20, 22], opens: '2N' }, note: 'Partner opened 2NT (20-22).' };
  const pn = (lf, lo, hi, calls) => PO({ calls, setup: r => ({ ...NTa, south: { lens: lf(r), hcp: [lo, hi] } }) });
  const mj = (t, o, def) => r => { const M = anyMajor(r); return rl(r, sp({ [M]: t, [5 - M]: o }, def)); };
  // Partner opens one of a suit (s), you hold t cards in it.
  const P1 = (t, lo, hi, calls, majorsOnly) => PO({ calls, setup: r => {
    const s = majorsOnly ? anyMajor(r) : ri(r, 0, 3);
    return { south: { lens: rl(r, sp({ [s]: t }, [0, 6])), hcp: [lo, hi] }, north: { lens: sp({ [s]: [5, 6] }, [1, 4]), hcp: [13, 18], opens: B(1, s) }, note: `Partner opened 1${SY[s]}.` };
  } });
  const sixOf = (r, ss) => { const s = pick(r, ss); return rl(r, sp({ [s]: [6, 6] }, [0, 4])); };
  const weakTwoA = SO({ south: { lens: r => sixOf(r, [1, 2, 3]), hcp: [5, 10] }, north: { hcp: [0, 18] }, calls: 1 });
  const wtP = id => want(PO({ calls: 1, setup: r => { const s = pick(r, [1, 2, 3]); return { south: { lens: rl(r, sp({ [s]: [0, 4] }, [0, 6])), hcp: id === 'E.weak-two-pass' ? [0, 13] : id === 'E.weak-two-raise' ? [4, 13] : [14, 18] }, north: { lens: sp({ [s]: [6, 6] }, [0, 4]), hcp: [5, 10], opens: B(2, s) }, note: `Partner opened a weak 2${SY[s]}.` }; } }), id, 60);
  const sets = [
    { id: 'a-open', name: 'Opening and rebidding', refs: 'Opening · C · D', acol: true,
      blurb: 'Open the right bid, then rebid: 1NT 12-14, balanced 15-19 via a suit and a no-trump rebid, unbalanced hands, weak twos and pre-empts.',
      recipes: [
        SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: majSpec, hcp: [0, 16] } }),
        SO({ south: { lens: balL, hcp: [15, 19] }, north: { hcp: [6, 12] } }), SO({ south: { lens: balL, hcp: [15, 19] }, north: { hcp: [6, 12] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [13, 14], ok: ub }, north: { hcp: [6, 12] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [15, 18], ok: ub }, north: { hcp: [6, 12] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [19, 22], ok: ub }, north: { hcp: [4, 12] } }),
        SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } }),
        want(weakTwoA, 'E.acol-weak-two'),
        want(SO({ south: { lens: r => { const s = ri(r, 0, 3); return rl(r, sp({ [s]: [7, 8] }, [0, 3])); }, hcp: [3, 9] }, north: { hcp: [0, 15] }, calls: 1 }), 'H.acol-preempt'),
        want(SO({ south: { lens: r => rl(r, sp({}, [1, 5])), hcp: [3, 12] }, north: { hcp: [0, 15], ok: opensAs('P') }, calls: 1 }), 'OB.acol-pass'),
      ] },
    { id: 'a-nt-resp', name: 'Responding to 1NT (12-14)', refs: 'A', acol: true,
      blurb: 'McKendrick, 2NT and 3NT, Stayman, weak take-outs and game in a major.',
      recipes: [
        pn(nmaj, 0, 10, 1), pn(nmaj, 11, 11, 2), pn(nmaj, 11, 11, 2), pn(nmaj, 12, 12, 1), pn(nmaj, 13, 20, 1),
        pn(mj([4, 4], [2, 4], [2, 5]), 11, 16, 2), pn(mj([4, 4], [2, 4], [2, 5]), 11, 16, 2),
        pn(r => { const s = pick(r, [1, 2]); return rl(r, sp({ [s]: [5, 6], 3: [0, 3] }, [0, 4])); }, 0, 11, 1),
        pn(r => rl(r, sp({ 3: [5, 6], 2: [0, 3] }, [0, 4])), 0, 11, 2),
        pn(r => rl(r, sp({ 3: [5, 5], 2: [4, 4] }, [0, 3])), 0, 11, 2),
        pn(mj([5, 5], [0, 3], [1, 4]), 12, 16, 1), pn(mj([6, 7], [0, 3], [0, 4]), 12, 16, 1),
        pn(r => { const m = ri(r, 0, 1); return rl(r, sp({ [m]: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3])); }, 12, 17, 1),
        pn(r => rl(r, sp({ 0: [6, 7], 2: [0, 3], 3: [0, 3], 1: [0, 3] }, [0, 3])), 0, 10, 2),
      ] },
    { id: 'a-nt-open', name: 'Opening 1NT (12-14)', refs: 'A', acol: true,
      blurb: 'You open a weak no-trump and answer partner: Stayman, McKendrick, invitations and game tries.',
      recipes: [
        ...[0, 1, 2].map(() => SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: majSpec, hcp: [8, 16] } })),
        SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [11, 12] } }),
        SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: () => sp({ 0: [6, 7], 2: [0, 3], 3: [0, 3] }, [0, 3]), hcp: [0, 10] } }),
        SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: r => { const M = anyMajor(r); return sp({ [M]: [5, 5], [5 - M]: [0, 3] }, [1, 4]); }, hcp: [12, 15] } }),
        want(SO({ south: { lens: balL, hcp: [12, 14] }, north: { lens: () => sp({ 2: [4, 4], 3: [0, 3] }, [2, 5]), hcp: [11, 12] } }), 'A.acol-invite-answer', 40),
      ] },
    { id: 'a-resp', name: 'Responding to a suit opening', refs: 'B · C · D', acol: true,
      blurb: 'Raises (2-3-4 by strength), new suits, 1NT/2NT/3NT, and your second call after opener rebids.',
      recipes: [
        P1([4, 5], 6, 9, 2, true), P1([4, 5], 10, 12, 1, true), P1([4, 5], 13, 15, 1, true), P1([4, 5], 16, 18, 2, true),
        P1([0, 3], 6, 9, 2), P1([0, 3], 6, 9, 2), P1([0, 3], 10, 12, 2), P1([0, 3], 13, 15, 2), P1([0, 3], 9, 15, 2),
        want(P1([0, 6], 0, 5, 1), 'B.acol-pass'),
        want(PO({ calls: 1, setup: r => { const s = ri(r, 2, 3); return { south: { lens: rl(r, sp({ [s]: [2, 3], [5 - s]: [2, 3] }, [2, 5])), hcp: [10, 15] }, north: { lens: sp({ [s]: [5, 6] }, [1, 4]), hcp: [13, 18], opens: B(1, s) }, note: `Partner opened 1${SY[s]}.` }; } }), ['B.acol-2nt', 'B.acol-3nt'], 40),
        want(PO({ calls: 1, setup: r => { const s = ri(r, 2, 3); return { south: { lens: rl(r, sp({ [s]: [2, 3], [5 - s]: [2, 3] }, [2, 5])), hcp: [13, 15] }, north: { lens: sp({ [s]: [5, 6] }, [1, 4]), hcp: [13, 18], opens: B(1, s) }, note: `Partner opened 1${SY[s]}.` }; } }), 'B.acol-3nt', 40),
        want(P1([0, 3], 6, 9, 2), 'B.acol-1nt', 40),
      ] },
    { id: 'a-rebid', name: "Opener's rebids", refs: 'C · D', acol: true,
      blurb: 'No-trump rebids for balanced 15-19, suit rebids for unbalanced hands, and answering partner after that.',
      recipes: [
        SO({ south: { lens: balL, hcp: [15, 19] }, north: { hcp: [6, 15] } }), SO({ south: { lens: balL, hcp: [15, 19] }, north: { hcp: [9, 15] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [13, 14], ok: ub }, north: { hcp: [6, 15] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [15, 18], ok: ub }, north: { hcp: [6, 12] } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [19, 22], ok: ub }, north: { hcp: [6, 12] } }),
        want(SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [13, 16] }, north: { lens: () => sp({ 2: [2, 3], 3: [2, 3] }, [2, 5]), hcp: [10, 12] } }), 'B.acol-after-2nt', 40),
        want(SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [13, 18] }, north: { hcp: [6, 13] } }), 'D.acol-opener-3', 40),
        want(SO({ south: { lens: r => { const M = anyMajor(r); return rl(r, sp({ [M]: [6, 6] }, [0, 4])); }, hcp: [13, 16], ok: ub }, north: { lens: (r, h) => { const M = ST.indexOf(acolOpening(h).bid[1]); return sp({ [M]: [2, 3] }, [2, 4]); }, hcp: [13, 15] } }), 'B.acol-after-3nt', 60),
      ] },
    { id: 'a-big', name: '2NT, weak twos and 2♣', refs: 'E', acol: true,
      blurb: '2NT 20-22, the 2NT ask over a weak two (Ogust or features), and 2♣ auctions from both sides.',
      recipes: [
        PO({ setup: r => ({ ...NT2a, south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 10] } }), calls: 1 }),
        PO({ setup: r => { const M = anyMajor(r); return { ...NT2a, south: { lens: rl(r, sp({ [M]: [4, 6] }, [0, 5])), hcp: [4, 10] } }; } }),
        SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } }),
        ...['E.weak-two-pass', 'E.weak-two-raise', 'E.weak-two-ask', ['GUIDE.weak-two-after-ask', 'E.ogust-after']].map(wtP),
        want(SO({ south: { lens: r => sixOf(r, [1, 2, 3]), hcp: [5, 10] }, north: { hcp: [14, 18] } }), ['E.ogust-answer', 'E.weak-two-answer'], 60),
        want(PO({ calls: 1, setup: r => { const w = pick(r, [1, 2, 3]); return { south: { lens: rl(r, sp({ [w]: [4, 5] }, [0, 5])), hcp: [14, 17] }, north: { lens: sp({ [w]: [6, 6] }, [0, 4]), hcp: [5, 10], opens: B(2, w) }, note: `Partner opened a weak 2${SY[w]}.` }; } }), 'E.acol-weak-two-own-suit', 60),
        PO({ setup: r => ({ south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 7] }, north: { lens: 'bal', hcp: [23, 24], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }) }),
        PO({ setup: r => { const s = ri(r, 2, 3); return { south: { lens: rl(r, sp({ [s]: [1, 4] }, [0, 6])), hcp: [0, 7] }, north: { lens: sp({ [s]: [5, 7] }, [0, 4]), hcp: [23, 26], opens: '2C' }, note: 'Partner opened 2♣ (23+).' }; } }),
        SO({ south: { lens: r => rl(r, sp({}, [1, 6])), hcp: [23, 26] }, north: { hcp: [0, 7] } }),
      ] },
    { id: 'a-slam', name: 'Slam: Blackwood', refs: 'G', acol: true, slam: true,
      blurb: 'A fit and 31+ between you: ask for aces with 4NT, then kings, and pick the level.',
      recipes: [
        SO({ south: { lens: r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [1, 4])); }, hcp: [16, 19], ok: h => /^1[HS]$/.test(acolOpening(h).bid || '') }, north: { lens: (r, h) => { const M = ST.indexOf(acolOpening(h).bid[1]); return sp({ [M]: [4, 5] }, [1, 4]); }, hcp: [13, 15] } }),
        PO({ setup: r => { const M = anyMajor(r); return { south: { lens: rl(r, sp({ [M]: [4, 5] }, [1, 4])), hcp: [13, 15] }, north: { lens: sp({ [M]: [5, 6] }, [1, 4]), hcp: [16, 19], opens: B(1, M) }, note: `Partner opened 1${SY[M]}.` }; } }),
        PO({ setup: r => { const M = anyMajor(r); return { south: { lens: rl(r, sp({ [M]: [4, 5] }, [1, 4])), hcp: [16, 19] }, north: { lens: sp({ [M]: [5, 6] }, [1, 4]), hcp: [13, 16], opens: B(1, M) }, note: `Partner opened 1${SY[M]}.` }; } }),
        PO({ setup: r => ({ ...NTa, south: { lens: nmaj(r), hcp: [19, 22] } }), calls: 1 }),
        want(SO({ south: { lens: r => { const M = anyMajor(r); return rl(r, sp({ [M]: [5, 6] }, [1, 4])); }, hcp: [13, 15], ok: h => /^1[HS]$/.test(acolOpening(h).bid || '') }, north: { lens: (r, h) => { const M = ST.indexOf(acolOpening(h).bid[1]); return sp({ [M]: [4, 5] }, [1, 4]); }, hcp: [17, 20] } }), 'G.acol-blackwood-answer', 40),   // partner asks: answer
      ] },
    { id: 'a-comp', name: 'Overcalls and doubles', refs: 'F · H', acol: true,
      blurb: 'Overcalls (jump = strong), takeout doubles and advancing them, bidding over interference, their 1NT and their pre-empts.',
      recipes: (() => {
        const OV = (lf, lo, hi) => r => { const x = ri(r, 0, 3); return oneCall('E', [B(1, x)], deal(r, lf(r, x), lo, hi), `RHO opened 1${SY[x]}.`); };
        return [
          OV(r => rl(r, sp({}, [0, 6])), 8, 15), OV(r => rl(r, sp({}, [0, 6])), 8, 15),
          OV((r, x) => rl(r, sp({ [x]: [0, 2] }, [3, 4])), 12, 17),
          OV((r, x) => balL(r), 16, 18),
          OV((r, x) => { const s = pick(r, [0, 1, 2, 3].filter(t => t !== x)); return rl(r, sp({ [s]: [6, 7], [x]: [0, 2] }, [0, 4])); }, 13, 16),
          r => oneCall('E', ['1N'], deal(r, rl(r, sp({}, [1, 7])), 6, 18), 'RHO opened 1NT (12-14).'),
          r => { const x = ri(r, 0, 3); return oneCall('E', [B(3, x)], deal(r, rl(r, sp({ [x]: [0, 2] }, [1, 7])), 12, 18), `RHO pre-empted 3${SY[x]}.`); },
          r => { const o = ri(r, 0, 3), v = pick(r, [0, 1, 2, 3].filter(t => t > o)); if (v === undefined) return null; return oneCall('N', [B(1, o), B(1, v)], deal(r, rl(r, sp({}, [0, 6])), 4, 15), `Partner opened 1${SY[o]}; RHO overcalled 1${SY[v]}.`); },
          r => { const o = ri(r, 0, 3); return oneCall('N', [B(1, o), 'X'], deal(r, rl(r, sp({}, [0, 6])), 4, 15), `Partner opened 1${SY[o]}; RHO doubled.`); },
          r => { const x = ri(r, 0, 3); return oneCall('W', [B(1, x), 'X', 'P'], deal(r, rl(r, sp({ [x]: [0, 3] }, [0, 6])), 0, 14), `LHO opened 1${SY[x]}; partner doubled for takeout.`); },
          r => { const x = ri(r, 0, 3), y = pick(r, [0, 1, 2, 3].filter(t => t !== x)), ov = B(y > x ? 1 : 2, y); return oneCall('W', [B(1, x), ov, 'P'], deal(r, rl(r, sp({}, [0, 6])), 4, 14), `LHO opened 1${SY[x]}; partner overcalled ${plain(ov)}.`); },
        ];
      })() },
  ];
  sets.push({ id: 'a-our-nt', name: 'Our 1NT doubled', refs: 'H', acol: true, helvic: true,
    blurb: 'They double our weak no-trump: sign off or sit it out, or wriggle out with Helvic.',
    recipes: ['values', 'one', 'two', 'wriggle', 'one', 'two', 'wriggle'].flatMap(k => [ourNT('resp', k), ourNT('open', k)])
      .concat([ourNT('open', 'one', true), ourNT('open', 'two', true)]) });
  const MIX = { id: 'a-mixed', name: 'Mixed auctions', refs: 'All', last: true, slam: true, acol: true, helvic: true, mixed: true,
    blurb: 'A hand from every Acol drill, shuffled together. Each new deal moves on to the next kind of hand in each drill.',
    get sources() { return sets; }, get recipes() { return sets.map(d => (rng, opts) => pick(rng, d.recipes)(rng, opts)); } };
  return sets.concat(MIX);
})();
