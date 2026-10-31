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
  if (p >= 13) { const s = acolLongest(l); return R(B(1, s), `${p} HCP unbalanced (13-22): open your longest suit, 1${SY[s]}${l.filter(n => n === l[s]).length > 1 ? ' (equal length: ♥ before ♠ before ♦ before ♣)' : ''}.`, 'OB.acol-suit'); }
  const s = acolLongest(l);
  if (mx >= 8 && p <= 9) return R(B(4, s), `${NUM[mx]}-card ${SN[s].replace(/s$/, '')} suit and ${p} HCP: pre-empt at the 4-level.`, 'H.acol-preempt');
  if (mx === 7 && p <= 9) return R(B(3, s), `Seven ${SN[s]} and ${p} HCP: pre-empt at the 3-level.`, 'H.acol-preempt');
  if (mx === 6 && s >= 1 && p >= 5 && p <= 10) return R(B(2, s), `Six ${SN[s]} and ${p} HCP: weak two, 2${SY[s]} (5-10).`, 'E.acol-weak-two');
  return R('P', `${p} HCP unbalanced: a suit opening needs 13+, and this is not a weak two or pre-empt. Pass.`, 'OB.acol-pass');
}

// ---------- A: responses to 1NT (12-14) ----------
function acolR1NT(h) {
  const p = hcp(h), l = L(h), H = l[2], S = l[3];
  if (H >= 4 && S >= 4 && Math.max(H, S) >= 5 && p <= 11) return R('2C', `${p} HCP, 5-4 in the majors: 2♣ Stayman, then pass if partner bids one of your majors, otherwise bid your five-card major to play.`, 'A.acol-stayman-weak');
  if (S >= 5 && p <= 11) return R('2C', `${p} HCP with weak spades: 2♠ would be McKendrick, so go through 2♣ Stayman, then bid 2♠ to play unless partner shows spades.`, 'A.acol-stayman-weak');
  const six = [3, 2].find(s => l[s] >= 6), five = [3, 2].find(s => l[s] === 5);
  if (p >= 12 && six !== undefined) return R(B(4, six), `${p} HCP with ${NUM[l[six]]} ${SN[six]}: 4${SY[six]}.`, 'A.acol-major-game');
  if (p >= 12 && five !== undefined) return R(B(3, five), `${p} HCP with five ${SN[five]}: 3${SY[five]} (forcing). Partner bids 4${SY[five]} with three, else 3NT.`, 'A.acol-major-3');
  if (p >= 11 && (H === 4 || S === 4)) return R('2C', `${p} HCP with a four-card major: 2♣ Stayman (11+).`, 'A.acol-stayman');
  if (p <= 11 && (H >= 5 || l[1] >= 5)) { const s = H >= 5 ? 2 : 1; return R(B(2, s), `${p} HCP (0-11) with ${NUM[l[s]]} ${SN[s]}: 2${SY[s]}, to play.`, 'A.acol-weak-suit'); }
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
      if (weak) {
        if (M >= 0 && l[M] >= 4) return R('P', `Partner showed ${SN[M]}, one of your suits: pass.`, 'A.acol-stayman-continue');
        const f = l[3] >= 5 ? 3 : 2;
        return R(B(2, f), `Partner didn't show your ${SN[f]}: bid 2${SY[f]}, to play.`, 'A.acol-stayman-continue');
      }
      if (M >= 0 && l[M] >= 4) return p >= 13 ? R(B(4, M), `A ${SN[M].replace(/s$/, '')} fit, and ${p} (13+): 4${SY[M]}.`, 'A.acol-stayman-continue') : R(B(3, M), `A ${SN[M].replace(/s$/, '')} fit, ${p} HCP (11-12): invite with 3${SY[M]}.`, 'A.acol-stayman-continue');
      if (a === '2H' && l[3] >= 4) return R('2S', `No heart fit, but four spades: 2♠. Partner bids 4♠ with four, else 3NT.`, 'A.acol-stayman-continue');
      return p >= 13 ? R('3N', `No fit, ${p} HCP (13+): 3NT.`, 'A.acol-stayman-continue') : R('2N', `No fit, ${p} HCP (11-12): invite with 2NT.`, 'A.acol-stayman-continue');
    }
    if (r === '2S') {
      if (p === 11) return a === '2N' ? R('P', `Partner has 12-13: with 11, pass 2NT.`, 'A.acol-mckendrick-continue') : R('3N', `Partner has 14: with 11 that's 25, bid 3NT.`, 'A.acol-mckendrick-continue');
      return a === '2N' ? R('3C', `Weak with long clubs: 3♣ to play.`, 'A.acol-mckendrick-continue') : R('P', `Weak with long clubs: pass 3♣.`, 'A.acol-mckendrick-continue');
    }
    return AP('Partner chose the contract.');
  }
  if (n === 4) {   // opener again
    const b = seq[3];
    if (r === '2C' && /^3[HS]$/.test(b)) { const M = ST.indexOf(b[1]); return p >= 13 ? R(B(4, M), `Partner invites with ${plain(b)}. With ${p} (13-14), accept: 4${SY[M]}.`, 'A.acol-invite-answer') : R('P', `Partner invites. With 12, pass.`, 'A.acol-invite-answer'); }
    if (r === '2C' && b === '2N') return p >= 13 ? R('3N', `Partner invites with 2NT. With ${p} (13-14), 3NT.`, 'A.acol-invite-answer') : R('P', `Partner invites with 2NT. With 12, pass.`, 'A.acol-invite-answer');
    if (r === '2C' && b === '2S' && seq[2] === '2H') return l[3] >= 4 ? R('4S', `Partner has four spades and so do you: 4♠.`, 'A.acol-invite-answer') : R('3N', `No spade fit: 3NT.`, 'A.acol-invite-answer');
    return AP('Partner chose the contract.');
  }
  return AP('The contract is set.');
}

// ---------- B: responses to a suit opening ----------
function acolR1(h, o) {
  const p = hcp(h), l = L(h), t = l[o], bal = isBal(h), sh = shapeResp(h), sw = p <= 5 && sh ? shapeWhy(h) : '';
  if (p <= 5 && !sh) return R('P', `${p} HCP: a response needs 6+. Pass.`, 'B.acol-pass');
  const pe = Math.max(p, sh ? 6 : 0);
  if (t >= 4 && o >= 2) {
    if (pe <= 9) return R(B(2, o), `${sw}${t}-card support, ${p} HCP: raise to 2${SY[o]} (6-9).`, 'B.acol-raise');
    if (pe <= 12) return R(B(3, o), `${t}-card support, ${p} HCP: raise to 3${SY[o]} (10-12).`, 'B.acol-raise');
    if (pe <= 15) return R(B(4, o), `${t}-card support, ${p} HCP: raise to 4${SY[o]} (13-15).`, 'B.acol-raise');
  }
  if (t >= 4 && o < 2 && pe <= 12 && ![2, 3].some(s => l[s] >= 4)) return R(B(pe <= 9 ? 2 : 3, o), `${t}-card support for partner's ${SN[o]}, ${p} HCP: raise to ${pe <= 9 ? 2 : 3}${SY[o]} (${pe <= 9 ? '6-9' : '10-12'}).`, 'B.acol-raise');
  // A new suit: longest (equal: lowest) at the 1-level with 6+, at the 2-level with 9+.
  const others = [0, 1, 2, 3].filter(s => s !== o && l[s] >= 4);
  const one = others.filter(s => s > o);
  const strong16 = pe >= 16 && t >= 4;
  if (bal && !strong16 && !one.length) {
    if (pe <= 9) return R('1N', `${sw}${p} HCP, fairly balanced, no 4-card suit to show at the 1-level: 1NT (6-9).`, 'B.acol-1nt');
    if (pe <= 12) return R('2N', `${p} HCP balanced: 2NT (10-12).`, 'B.acol-2nt');
    if (pe <= 15) return R('3N', `${p} HCP balanced: 3NT (13-15).`, 'B.acol-3nt');
  }
  const pool = (pe >= 9 ? others : one);
  if (!pool.length) {
    if (pe <= 9) return R('1N', `${sw}${p} HCP and no suit to show at the 1-level: 1NT (6-9).`, 'B.acol-1nt');
    return bal ? R(pe <= 12 ? '2N' : '3N', `${p} HCP balanced: ${pe <= 12 ? '2NT (10-12)' : '3NT (13-15)'}.`, pe <= 12 ? 'B.acol-2nt' : 'B.acol-3nt') : gap('The chart has no response for this hand.');
  }
  const mx = Math.max(...pool.map(s => l[s])), s = pool.filter(u => l[u] === mx)[0];
  const b = B(s > o ? 1 : 2, s);
  return R(b, `${sw}${strong16 ? `${t}-card support and ${p} HCP (16+): bid a new suit first, then support. ` : `${p} HCP: `}new suit, longest first (equal length: the lower): ${plain(b)}. ${s > o ? '1-level needs 6+' : '2-level needs 9+'}; forcing.`, strong16 ? 'B.acol-new-suit-support' : 'B.acol-new-suit');
}

// ---------- C and D: opener's rebid ----------
function acolRebid(h, o, r) {
  const p = hcp(h), l = L(h), bal = isBal(h), rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1, rl = +r[0];
  // Raises of opener's suit.
  if (rs === o) {
    if (rl === 2) return p >= 19 ? R(B(4, o), `Partner's raise shows 6-9. With ${p} (19+), bid game.`, 'B.acol-after-raise') : p >= 16 ? R(B(3, o), `Partner's raise shows 6-9. With ${p} (16+), try for game with 3${SY[o]}.`, 'B.acol-after-raise') : R('P', `Partner's raise shows 6-9. With ${p}, pass.`, 'B.acol-after-raise');
    if (rl === 3) return acolSlamTry(h, o, 10, "Partner's raise to 3 (10-12)") || (p >= 14 ? R(o >= 2 ? B(4, o) : '3N', `Partner's raise shows 10-12. With ${p} (14+), bid game.`, 'B.acol-after-raise') : R('P', `Partner's raise shows 10-12. With ${p}, pass.`, 'B.acol-after-raise'));
    return acolSlamTry(h, o, 13, "Partner's raise to 4 (13-15)") || AP('Partner bid game.');
  }
  if (r === '2N') return p >= 14 || bal ? R('3N', `Partner's 2NT shows 10-12 balanced. With ${p}${bal ? ' balanced' : ' (14+)'}, bid 3NT.`, 'B.acol-after-2nt') : R('P', `Partner's 2NT shows 10-12. With 13 unbalanced, pass.`, 'B.acol-after-2nt');
  if (r === '3N') return AP('Partner bid game.');
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
    const js = B(cheapest(s2, r) + 1, s2);
    return R(js, `${p} HCP (19-22): jump shift, ${plain(js)}, game forcing.`, 'D.acol-jump-shift');
  }
  // A 6-5 or 5-5 hand shows its second five-card suit, even as a reverse: with 15-18, or with
  // 13-14 when the shape makes up the difference (5 losers or fewer). Rebid it next time to show five.
  const five = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 5).sort((a, b) => l[b] - l[a] || b - a)[0];
  if (five !== undefined && !sup && (p >= 15 || losers(h) <= 5)) {
    const b = B(cheapest(five, r), five), rev = bv(b) > bv(bar);
    return R(b, `${p} HCP${p < 15 ? ` but only ${losers(h)} losers` : ''}, ${NUM[l[o]]} ${SN[o]} and ${NUM[l[five]]} ${SN[five]}: show the second suit, ${plain(b)}${rev ? ' (a reverse, forcing)' : ''}. Bid ${SN[five]} again next time to show five.`, 'D.acol-strong');
  }
  if (p >= 15) {
    if (sup) return R(B(rlv + 2, rs), `${p} HCP (15-18) with four ${SN[rs]}: double raise to ${plain(B(rlv + 2, rs))}.`, 'D.acol-strong');
    if (l[o] >= 6) return R(B(3, o), `${p} HCP (15-18) with ${NUM[l[o]]} ${SN[o]}: jump rebid, 3${SY[o]}.`, 'D.acol-strong');
    const s2 = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 4).sort((a, b) => l[b] - l[a] || b - a)[0];
    if (s2 !== undefined) { const b = B(cheapest(s2, r), s2); return R(b, `${p} HCP (15-18): show your second suit, ${plain(b)}${bv(b) > bv(bar) ? ' (a reverse)' : ''}.`, 'D.acol-strong'); }
    return R(B(cheapest(o, r), o), `${p} HCP (15-18) with nothing else to show: rebid ${SN[o]}.`, 'D.acol-strong');
  }
  if (sup) return R(B(rlv + 1, rs), `13-14 with four ${SN[rs]}: raise to ${plain(B(rlv + 1, rs))}.`, 'D.acol-weak');
  // Never skip a four-card major: after a 2-level response (9+) it can be shown at the 2-level
  // with a minimum. It's not a reverse in strength.
  const mj = rl === 2 && rs >= 0 ? [3, 2].find(s => s !== o && s !== rs && l[s] >= 4 && cheapest(s, r) === 2) : undefined;
  if (mj !== undefined && bv(B(2, mj)) > bv(bar)) return R(B(2, mj), `13-14 with four ${SN[mj]}: never skip a four-card major. Partner's 2-level response shows 9+, so ${plain(B(2, mj))} doesn't promise extra strength here.`, 'D.acol-weak');
  const s2 = [0, 1, 2, 3].filter(s => s !== o && s !== rs && l[s] >= 4 && bv(B(cheapest(s, r), s)) < bv(bar)).sort((a, b) => l[b] - l[a])[0];
  if (s2 !== undefined) { const b = B(cheapest(s2, r), s2); return R(b, `13-14: show your second suit below the barrier, ${plain(b)}.`, 'D.acol-weak'); }
  if (l[o] >= 5) return R(B(cheapest(o, r), o), `13-14 with ${NUM[l[o]]} ${SN[o]}: rebid them, ${plain(B(cheapest(o, r), o))}.`, 'D.acol-weak');
  if (r === '1N') return R('P', `13-14 and partner's 1NT (6-9): pass.`, 'D.acol-weak');
  const nt = bv('1N') > bv(r) ? '1N' : '2N';
  return R(nt, `13-14 with nothing else to show: ${plain(nt)}.`, 'D.acol-weak');
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
    if (p >= need) return R(six !== undefined ? B(4, six) : '3N', `${why} With ${p}, bid game.`, 'C.acol-after-nt');
    if (x === '1N' && p === 9) return R('2N', `${why} With 9, invite with 2NT.`, 'C.acol-after-nt');
    if (x === '1N' && six !== undefined) return R(B(2, six), `${why} With ${p} and ${NUM[l[six]]} ${SN[six]}, sign off in 2${SY[six]}.`, 'C.acol-after-nt');
    return R('P', `${why} With ${p}, pass.`, 'C.acol-after-nt');
  }
  if (gameBid(x)) return AP('Opener bid game.');
  const bar = B(2, o), game = s => s >= 2 ? B(4, s) : '3N';
  // Opener raised responder's suit.
  if (xs === rs) {
    const dbl = xl >= rl + 2;
    if (dbl) return p >= 10 ? R(game(rs), `Opener's double raise shows 15-18. With ${p} (10+), bid game.`, 'D.acol-after') : R('P', `Opener's double raise shows 15-18. With ${p}, pass.`, 'D.acol-after');
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
    if (l[xs] >= 4 && xs >= 2) return R(B(4, xs), `Opener's jump shift is game forcing (19-22). With ${l[xs]} ${SN[xs]}, support: 4${SY[xs]}.`, 'D.acol-after');
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
    return p >= 10 ? R(l[o] >= 2 && o >= 2 ? B(4, o) : '3N', `Opener's jump rebid shows 15-18 with six. With ${p} (10+), bid game.`, 'D.acol-after') : R('P', `Opener's jump rebid shows 15-18. With ${p} (6-9), pass.`, 'D.acol-after');
  }
  if (xs === o) {   // simple rebid of a 5+ suit: 13-14
    if (l[o] >= 3) return p >= 13 ? R(game(o), `Opener rebids ${SN[o]} (13-14). With ${l[o]} of them and ${p} (13+), bid game.`, 'D.acol-after') : p >= 11 ? R(B(3, o), `Opener rebids ${SN[o]}. With ${l[o]} of them and ${p} (11-12), invite: 3${SY[o]}.`, 'D.acol-after') : R('P', `Opener rebids ${SN[o]} (13-14). With ${p}, pass.`, 'D.acol-after');
    return p >= 13 ? R('3N', `Opener rebids ${SN[o]}. With ${p} (13+), 3NT.`, 'D.acol-after') : p >= 11 ? R('2N', `Opener rebids ${SN[o]}. With ${p} (11-12), 2NT invites.`, 'D.acol-after') : R('P', `Opener rebids ${SN[o]}. With ${p}, pass.`, 'D.acol-after');
  }
  if (xs >= 0 && xs !== rs) {   // new suit below the barrier: 13-14
    if (l[xs] >= 4) return p >= 13 ? R(game(xs), `Opener's ${plain(x)} shows ${SN[xs]}. With four and ${p} (13+), bid game.`, 'D.acol-after') : p >= 11 ? R(B(xl + 1, xs), `Opener's ${plain(x)}: with four ${SN[xs]} and ${p} (11-12), invite.`, 'D.acol-after') : R('P', `Opener's ${plain(x)}: with four ${SN[xs]} and ${p}, pass.`, 'D.acol-after');
    if (p >= 13) return R('3N', `Opener's ${plain(x)} shows 13-14. With ${p} (13+), 3NT.`, 'D.acol-after');
    if (p >= 11) return R('2N', `Opener's ${plain(x)} shows 13-14. With ${p} (11-12), 2NT invites.`, 'D.acol-after');
    if (l[o] >= l[xs] && l[o] >= 2) return R(B(cheapest(o, x), o), `Opener's ${plain(x)} shows 13-14. With ${p}, give preference: ${plain(B(cheapest(o, x), o))}.`, 'D.acol-after');
    return R('P', `Opener's ${plain(x)} shows 13-14. With ${p}, pass.`, 'D.acol-after');
  }
  return gap('The chart has no call here.');
}
// Opener's third call: answer invitations; otherwise pass.
function acolOpener3(h, seq) {
  const p = hcp(h), l = L(h), x = seq[2], a = seq[3];
  if (gameBid(a) || a === '6N' || a === 'P') return AP('Partner chose the contract.');
  const as = /^\d[CDHS]$/.test(a) ? ST.indexOf(a[1]) : -1;
  // After our reverse, partner's simple preference shows 6-9 and a fit: with a two-suiter of
  // 4 losers or fewer, the shape is worth game.
  const o = ST.indexOf(seq[0][1]), xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, ls = losers(h);
  if (xs >= 0 && xs !== o && bv(x) > bv(B(2, o)) && (as === o || as === xs) && +a[0] === 3 && ls <= 4) {
    const g = as >= 2 ? B(4, as) : B(5, as);
    return R(g, `Partner's ${plain(a)} shows 6-9 and a ${SN[as]} fit. Your ${NUM[l[o]]}-${NUM[l[xs]]} shape has only ${ls} losers, so bid game: ${plain(g)}.`, 'D.acol-opener-3');
  }
  if (a === '2N') { const need = x === '1N' ? 16 : 14; return p >= need ? R('3N', `Partner invites with 2NT. With ${p}, accept: 3NT.`, 'D.acol-opener-3') : R('P', `Partner invites with 2NT. With ${p}, pass.`, 'D.acol-opener-3'); }
  if (as >= 0 && +a[0] === 3) return p >= 14 || (as >= 2 && l[as] >= 4 && p >= 13) ? R(as >= 2 ? B(4, as) : '3N', `Partner's ${plain(a)} invites. With ${p}, accept.`, 'D.acol-opener-3') : R('P', `Partner's ${plain(a)} invites. With ${p}, a minimum, pass.`, 'D.acol-opener-3');
  return R('P', `Partner's ${plain(a)} is a sign-off or preference: pass.`, 'D.acol-opener-3');
}
function acolAfter1Suit(seq, h) {
  const n = seq.length, o = ST.indexOf(seq[0][1]), r = seq[1];
  // Trumps for Blackwood: a suit both partners have bid before 4NT.
  const pre = seq.slice(0, seq.indexOf('4N') < 0 ? seq.length : seq.indexOf('4N'));
  const T = [3, 2, 1, 0].find(s => pre.some((c, i) => i % 2 === 0 && c[1] === ST[s] && /^\d/.test(c)) && pre.some((c, i) => i % 2 === 1 && c[1] === ST[s] && /^\d/.test(c)));
  if (seq.includes('4N')) return T !== undefined ? acolBlackwood(seq, h, T) : AP('');
  if (n === 1) return acolR1(h, o);
  if (n === 2) return acolRebid(h, o, r);
  if (n === 3) {
    const x = seq[2], rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1;
    // Raised by opener after responder's 2M raise / 3M raise.
    if (rs === o) {
      if (x === B(3, o) && +r[0] === 2) return hcp(h) >= 8 ? R(B(4, o), `Opener's 3${SY[o]} is a game try (16+). With ${hcp(h)} (8-9), accept: 4${SY[o]}.`, 'B.acol-after-raise') : R('P', `Opener's game try: with ${hcp(h)} (6-7), pass.`, 'B.acol-after-raise');
      return AP('Opener chose the contract.');
    }
    // 16+ with support: new suit, then support.
    if (acolR1(h, o).id === 'B.acol-new-suit-support') return acolSlamTry(h, o, 13, "Opener's opening (13+)") || R(o >= 2 ? B(4, o) : '3N', `You bid a new suit first with ${L(h)[o]}-card support and 16+: now support, game in ${o >= 2 ? SN[o] : 'no-trumps'}.`, 'B.acol-new-suit-support');
    if (r === '2N' || r === '3N' || x === 'P' || gameBid(x)) return AP('Opener chose the contract.');
    return acolResp2(h, seq);
  }
  if (n === 4) return acolOpener3(h, seq);
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
    return R('3N', `Partner shows a long minor. 3NT.`, 'E.acol-2c-continue');
  }
  if (n === 4 && seq[3] === '2N') { const s = ST.indexOf(x[1]); return l[s] >= 6 ? R(B(4, s), `Partner is weak (0-3). With six ${SN[s]}, 4${SY[s]}.`, 'E.acol-2c-continue') : R('3N', `Partner is weak (0-3): 3NT.`, 'E.acol-2c-continue'); }
  return AP('Partner chose the contract.');
}

// ---------- G: Blackwood ----------
// Once a fit is found and the two hands hold 31+, ask for aces with 4NT (5♣ 0/4, 5♦ 1, 5♥ 2,
// 5♠ 3); missing two: 5 of the suit; missing one: 6; all four: 5NT asks kings (6♣ 0/4 …).
const aces = h => [0, 1, 2, 3].filter(s => has(h, s, 14)).length;
function acolSlamTry(h, T, minP, desc) {
  const p = hcp(h);
  if (p + minP < 31) return null;
  return R('4N', `${desc} shows at least ${minP}. With ${p} that's ${p + minP}+ between you and a ${SN[T]} fit: ask for aces with 4NT (Blackwood).`, 'G.acol-blackwood');
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
  if (/^2[DHS]$/.test(o)) return afterWeakTwo(seq, h);
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
  const mx = Math.max(...un.map(s => l[s])), s = un.filter(u => l[u] === mx).sort((a, b) => b - a)[0];
  if (p >= 12) { const g = s >= 2 ? B(4, s) : stop(h, x) ? '3N' : B(5, s); return R(g, `Partner's double asks for your longest suit. With ${p} (12+), bid game: ${plain(g)}.`, 'F.acol-advance'); }
  const b = B(cheapest(s, B(1, x)) + (p >= 9 ? 1 : 0), s);
  return R(b, `Partner's double asks for your longest suit, ${SN[s]}. With ${p} (${p >= 9 ? '9-11: jump' : '0-8: cheapest'}), ${plain(b)}. Don't pass.`, 'F.acol-advance');
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
  if (last === 'X') return R(c.bid, `RHO's double changes nothing: ${c.why}`, 'F.acol-ignore');
  const y = ST.indexOf(last[1]);
  if (c.bid[1] === 'N') {
    if (!stop(h, y)) return R('P', `You would have bid ${plain(c.bid)}, but no-trumps needs a good ${SN[y]} stopper: pass.`, 'F.acol-ignore');
    const b = bv(c.bid) > bv(last) ? c.bid : (+c.bid[0] + 1) + 'N';
    return R(b, `RHO's ${plain(last)} changes little: with a ${SN[y]} stopper, ${plain(b)}.`, 'F.acol-ignore');
  }
  if (bv(c.bid) > bv(last)) return R(c.bid, `Ignore RHO's ${plain(last)}: ${c.why}`, 'F.acol-ignore');
  const s = ST.indexOf(c.bid[1]), b = B(cheapest(s, last), s);
  if (+b[0] - +c.bid[0] >= 1 && hcp(h) < 9 && s !== o) return R('P', `You would have bid ${plain(c.bid)}, but now it needs the ${b[0]}-level (9+): pass.`, 'F.acol-ignore');
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
      const s = un.filter(u => l[u] >= 6).sort((a, b) => l[b] - l[a])[0];
      if (s !== undefined) { const b = B(l[s] >= 7 ? 4 : cheapest(s, open.call), s); return R(b, `${p} HCP with ${NUM[l[s]]} ${SN[s]}: ${plain(b)}.`, 'H.acol-vs-preempt'); }
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
      ] },
    { id: 'a-big', name: '2NT, weak twos and 2♣', refs: 'E', acol: true,
      blurb: '2NT 20-22, the 2NT ask over a weak two (Ogust or features), and 2♣ auctions from both sides.',
      recipes: [
        PO({ setup: r => ({ ...NT2a, south: { lens: rl(r, sp({}, [0, 6])), hcp: [0, 10] } }), calls: 1 }),
        PO({ setup: r => { const M = anyMajor(r); return { ...NT2a, south: { lens: rl(r, sp({ [M]: [4, 6] }, [0, 5])), hcp: [4, 10] } }; } }),
        SO({ south: { lens: balL, hcp: [20, 22] }, north: { lens: majSpec, hcp: [0, 10] } }),
        ...['E.weak-two-pass', 'E.weak-two-raise', 'E.weak-two-ask', ['GUIDE.weak-two-after-ask', 'E.ogust-after']].map(wtP),
        want(SO({ south: { lens: r => sixOf(r, [1, 2, 3]), hcp: [5, 10] }, north: { hcp: [14, 18] } }), ['E.ogust-answer', 'E.weak-two-answer'], 60),
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
        want(PO({ setup: r => { const M = anyMajor(r); return { south: { lens: rl(r, sp({ [M]: [4, 5] }, [1, 4])), hcp: [13, 15] }, north: { lens: sp({ [M]: [5, 6] }, [1, 4]), hcp: [18, 21], opens: B(1, M) }, note: `Partner opened 1${SY[M]}.` }; } }), 'G.acol-blackwood-answer', 40),   // partner asks: answer
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
