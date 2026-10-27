// Full-auction bidder: decides which chart rule applies at each point, then plays a
// whole auction with both partners following the chart.
//
// The auction itself has all four seats (see auctionState at the bottom). The after…
// functions read `seq`, the partnership's calls only, so seq[0] is the opening,
// seq[1] the response, seq[2] opener's rebid, and so on.
'use strict';

// An automatic pass (partner has placed the contract). Auto calls are never asked of the user.
const AP = why => ({ bid: 'P', why, id: 'auto.pass', ref: '', auto: true });

// The 2NT structure, shared by a 2NT opening (pm = 3) and 2♣-2♦-2NT (pm = 1).
// seq starts at the 2NT bid.
function nt2(seq, h, pm) {
  const n = seq.length, r = seq[1], l = L(h), p = hcp(h);
  if (n === 1) return over2Nx(h, pm);
  if (n === 2) {
    if (r === '3C') return l[2] >= 4 ? R('3H', 'Answering 3♣ Stayman: four hearts, 3♥.', 'E.2nt-stayman-answer') : l[3] >= 4 ? R('3S', 'Answering 3♣ Stayman: four spades, 3♠.', 'E.2nt-stayman-answer') : R('3D', 'Answering 3♣ Stayman: no 4-card major, 3♦.', 'E.2nt-stayman-answer');
    if (r === '3D') return R('3H', '3♦ is a transfer: complete it with 3♥.', 'E.2nt-transfer-complete');
    if (r === '3H') return R('3S', '3♥ is a transfer: complete it with 3♠.', 'E.2nt-transfer-complete');
    if (r === '4D') return R('4H', 'Texas: complete to 4♥.', 'E.2nt-texas-complete');
    if (r === '4H') return R('4S', 'Texas: complete to 4♠.', 'E.2nt-texas-complete');
    if (r === '3N') return AP('Partner bid game.');
    return gap('The chart has no answer to this response to 2NT.');
  }
  if (n === 3) {
    if (r === '3C') {
      const a = seq[2];
      if (a === '3H') return l[2] >= 4 ? R('4H', 'Opener has four hearts and so do you: 4♥.', 'E.2nt-stayman-continue') : R('3N', 'No heart fit: 3NT.', 'E.2nt-stayman-continue');
      if (a === '3S') return l[3] >= 4 ? R('4S', 'Opener has four spades and so do you: 4♠.', 'E.2nt-stayman-continue') : R('3N', 'No spade fit: 3NT.', 'E.2nt-stayman-continue');
      const f5 = l[3] >= 5 && l[2] >= 4 ? 3 : l[2] >= 5 && l[3] >= 4 ? 2 : -1;
      if (f5 >= 0) { const f4 = f5 === 3 ? 2 : 3; return R(B(3, f4), `Opener has no 4-card major. Smolen, as over 1NT: bid your four-card major, 3${SY[f4]}, to show five ${SN[f5]}. Opener bids 4${SY[f5]} with three, else 3NT, and plays it from the strong hand.`, 'E.2nt-stayman-continue'); }
      return R('3N', 'Opener has no 4-card major: 3NT.', 'E.2nt-stayman-continue');
    }
    if (r === '3D' || r === '3H') {
      const M = r === '3D' ? 2 : 3;
      if (p <= pm) return R('P', `${p} HCP: pass the completion.`, 'E.2nt-transfer-continue');
      if (choice2N(h, M)) return R('3N', `${p} HCP with exactly five ${SN[M]}: 3NT offers a choice of games. Partner passes with two ${SN[M]}, or bids 4${SY[M]} with three or more, so you only miss a 5-2 fit.`, 'E.2nt-transfer-choice');
      return R(B(4, M), `${p} HCP${l[M] >= 6 ? ` with ${l[M]} ${SN[M]}` : ` with five ${SN[M]}`}: the major is the right game, so raise to 4${SY[M]}.`, 'E.2nt-transfer-continue');
    }
    if (r === '4D' || r === '4H') return R('P', 'Texas was a sign-off: pass.', 'E.2nt-texas-pass');
    return gap('The chart has no continuation here.');
  }
  if (n === 4) {
    const a = seq[3];
    if ((r === '3D' || r === '3H') && a === '3N') {
      const M = r === '3D' ? 2 : 3;
      return l[M] >= 3 ? R(B(4, M), `Partner's 3NT shows exactly five ${SN[M]} and offers a choice. With ${l[M]} ${SN[M]}, correct to 4${SY[M]}.`, 'E.2nt-choice-answer')
        : R('P', `Partner's 3NT shows five ${SN[M]} and offers a choice. With only ${l[M]}, pass 3NT.`, 'E.2nt-choice-answer');
    }
    if (r === '3C' && seq[2] === '3D' && /^3[HS]$/.test(a)) { const M = a === '3H' ? 3 : 2; return l[M] >= 3 ? R(B(4, M), `Partner's ${plain(a)} is Smolen: four ${SN[5 - M]} and five ${SN[M]}. With ${l[M]} ${SN[M]}, bid 4${SY[M]}.`, 'E.2nt-choice-answer') : R('3N', `Partner's ${plain(a)} is Smolen: five ${SN[M]}. With only ${l[M]}, 3NT.`, 'E.2nt-choice-answer'); }
    if (a === '3N' || /^4[HS]$/.test(a)) return AP('Partner chose the contract.');
  }
  if (n === 5 && /^(4[HS]|3N)$/.test(seq[4])) return AP('Partner chose the contract.');   // corrected the 3NT choice
  return gap('The chart has no further calls in this 2NT auction.');
}

// Everything after 4NT RKCB with trumps T: replies, the decision, 5NT for kings, the grand.
// strong: partner opened 2NT or 2♣, so an unclear reply is read high.
function afterRKCB(seq, h, T, strong) {
  const i4 = seq.indexOf('4N'), k = seq.length - 1 - i4;
  if (k === 0) return rkReply(h, T);
  if (k === 1) return askDecide(h, T, seq[i4 + 1], strong);
  if (k === 2) return seq[i4 + 2] === '5N' ? kingReply(h, T) : AP('Partner placed the contract after RKCB.');
  if (k === 3 && seq[i4 + 2] === '5N') return grandDecide(h, T, seq[i4 + 3]);
  return AP('The contract is set.');
}

// ---------- One function per opening bid ----------
function after1NT(seq, h) {
  const n = seq.length, p = hcp(h), l = L(h), r = seq[1];
  if (n === 1) return r1NT(h);
  if (n === 2) {
    switch (r) {
      case '2C': return stayAns(h);
      case '2D': return R('2H', '2♦ is a transfer: complete it with 2♥.', 'A.transfer-complete');
      case '2H': return R('2S', '2♥ is a transfer: complete it with 2♠.', 'A.transfer-complete');
      case '4D': return R('4H', 'Texas: complete to 4♥.', 'A.texas-complete');
      case '4H': return R('4S', 'Texas: complete to 4♠.', 'A.texas-complete');
      case '2S': return rangeAns(h);
      case '2N': return inv(h);
      case '4N': return p <= 15 ? R('P', '15 HCP is a minimum: pass the quantitative 4NT.', 'A.quantitative-answer') : R('6N', `${p} HCP is a maximum (16-17): bid 6NT.`, 'A.quantitative-answer');
      case '3N': return AP('Partner bid game.');
    }
    return gap('The chart has no answer to this response to 1NT.');
  }
  if (n === 3) {
    const a = seq[2];
    if (r === '2C') return afterStay(h, a);
    if (r === '2D') return afterXfer(h, 2);
    if (r === '2H') return afterXfer(h, 3);
    if (r === '2S') return rangeResp(h, a);
    if (r === '4D' || r === '4H') return R('P', 'Texas was a sign-off: pass.', 'A.texas-pass');
    if (r === '2N' || r === '4N') return AP('Partner accepted the invitation.');
    return gap('The chart has no continuation after this response to 1NT.');
  }
  if (n === 4) {   // opener's third call
    const rep = seq[2], a = seq[3];
    if (r === '2C') {
      if (rep === '2D') {
        if (a === '2N') return inv(h);
        if (a === '3H') return smolenAns(h, 3);
        if (a === '3S') return smolenAns(h, 2);
        if (a === '3N' || a === '2H' || a === '2S') return AP('Partner signed off.');
        return gap('The chart has no answer to this call after 2♦.');
      }
      if (rep === '2H') {
        if (a === '3H') return inv4(h, 2);
        if (a === '2N') return l[3] >= 4 ? gap('With four spades as well, the chart gives opener no answer to the 2NT invitation.') : inv(h);
        if (a === '2S') return l[3] >= 4 ? R('4S', 'Partner\'s 2♠ shows four spades, game forcing. You have four: 4♠.', 'A.stayman-2s-answer') : R('3N', 'Partner\'s 2♠ shows four spades, game forcing. You have fewer than four: 3NT.', 'A.stayman-2s-answer');
        if (a === '4H' || a === '3N') return AP('Partner bid game.');
        return gap('The chart has no answer to this call after 2♥.');
      }
      if (rep === '2S') {
        if (a === '3S') return inv4(h, 3);
        if (a === '2N') return inv(h);
        if (a === '4S' || a === '3N') return AP('Partner bid game.');
        return gap('The chart has no answer to this call after 2♠.');
      }
    }
    if (r === '2D' || r === '2H') {
      const M = r === '2D' ? 2 : 3;
      if (a === '2N') return l[M] >= 3 ? invFit(h, M) : inv(h);
      if (a === B(3, M)) return inv4(h, M);
      if (a === '3N') return l[M] >= 3 ? R(B(4, M), `Partner showed five ${SN[M]} and 10-14. With ${l[M]} ${SN[M]}, correct to 4${SY[M]}.`, 'A.transfer-3nt-answer') : R('P', `Partner showed five ${SN[M]}. With only ${l[M]}, pass 3NT.`, 'A.transfer-3nt-answer');
      return gap('The chart has no answer to this call after the transfer.');
    }
    if (r === '2S' && (a === '3N' || a === '3C' || a === '3D')) return AP('Partner chose the contract.');
    return gap('The chart has no further calls in this 1NT auction.');
  }
  if (n === 5) {
    const b = seq[4];
    if ((r === '2D' || r === '2H') && seq[3] === '2N' && b === B(3, r === '2D' ? 2 : 3)) return R('P', `Partner's ${plain(b)} shows a minimum (15) with three ${SN[r === '2D' ? 2 : 3]}: a part-score in the 5-3 fit. Pass.`, 'A.transfer-invite-answer');
    if (b === '3N' || /^4[HS]$/.test(b)) return AP('Partner chose the contract.');
  }
  return gap('The chart has no further calls in this 1NT auction.');
}

function after2C(seq, h) {
  const n = seq.length, l = L(h), x = seq[2];
  if (n === 1) return over2C(h);
  if (seq[1] !== '2D') return after2CPositive(seq, h);
  if (n === 2) return twoClubRebid(h);
  if (x === '2N') return nt2(seq.slice(2), h, 1);
  if (n === 3 && x === '3N') return AP('Partner bid game.');
  // The chart stops after opener's suit rebid; this continuation is a trainer guide.
  if (n === 3 && /^(2[HS]|3[CD])$/.test(x)) {
    const s = ST.indexOf(x[1]);
    if (s >= 2 && l[s] >= 3) return R(B(4, s), `Partner's ${plain(x)} shows 5+ ${SN[s]} and 2♣ forced to game. With ${l[s]} ${SN[s]} and a weak hand, raise to game: 4${SY[s]}.`, 'GUIDE.2c-rebid-answer');
    return R('3N', `Partner's ${plain(x)} shows 5+ ${SN[s]} and 2♣ forced to game. ${s >= 2 ? `With only ${cardsOf(l[s], s)}, bid 3NT.` : 'A minor-suit game needs eleven tricks, so bid 3NT.'}`, 'GUIDE.2c-rebid-answer');
  }
  if (n === 4 && gameBid(seq[3])) return AP('Partner chose the game.');
  return gap('The chart has no continuation after this 2♣ rebid.');
}

// 2♣ – positive response (8+): a trainer guide. With a fit, ask for key cards (23 + 8 = 31+).
function after2CPositive(seq, h) {
  const n = seq.length, p = hcp(h), l = L(h), r = seq[1];
  const rs = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1;
  if (seq.includes('4N')) return afterRKCB(seq, h, rs >= 0 ? rs : ST.indexOf(seq[2][1]));
  if (n === 2) {   // opener
    if (r === '2N' || r === '3N') {
      const rmin = r === '2N' ? 8 : 10, M = [3, 2].find(s => l[s] >= 5);
      if (M !== undefined && r === '2N') return R(B(3, M), `Partner's 2NT is balanced 8-9. Show your five ${SN[M]}: 3${SY[M]} (forcing).`, 'GUIDE.2c-positive-rebid');
      if (p + rmin >= 33) return R('6N', `Partner shows ${rmin}+ balanced: ${p} + ${rmin} = ${p + rmin}+, enough for 6NT.`, 'GUIDE.2c-positive-rebid');
      return r === '3N' ? R('P', `Partner's 3NT shows 10-12 balanced. ${p} + 10 is under 33: pass.`, 'GUIDE.2c-positive-rebid') : R('3N', `Partner's 2NT shows 8-9 balanced. ${p} + 8 is under 33: 3NT.`, 'GUIDE.2c-positive-rebid');
    }
    if (rs >= 0 && l[rs] >= (rs >= 2 ? 4 : 3)) return slamTry(h, rs, 8, `Partner's positive ${plain(r)} (8+)`) || R(B(rs >= 2 ? 4 : 5, rs), `Partner's ${plain(r)} gives you a fit: game in ${SN[rs]}.`, 'GUIDE.2c-positive-rebid');
    const own = [3, 2, 1, 0].filter(s => s !== rs && l[s] >= 5).sort((a, b) => l[b] - l[a])[0];
    if (own !== undefined) { const b = B(cheapest(own, r), own); return R(b, `No fit for partner's ${plain(r)} yet. Show your own suit: ${plain(b)}.`, 'GUIDE.2c-positive-rebid'); }
    return R('3N', `No fit for partner's ${plain(r)}: 3NT.`, 'GUIDE.2c-positive-rebid');
  }
  if (n === 3) {   // responder
    const x = seq[2];
    if (x === '6N' || x === '3N' || gameBid(x) || x === 'P') return AP('Partner chose the contract.');
    const xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1;
    if (xs >= 0) {
      if (xs >= 2 && l[xs] >= 3) return R(B(4, xs), `Partner's ${plain(x)} shows five ${SN[xs]}. With ${l[xs]}, raise to 4${SY[xs]}.`, 'GUIDE.2c-positive-continue');
      if (bv('3N') > bv(x)) return R('3N', `Partner's ${plain(x)} shows ${SN[xs]}. Without a fit, 3NT.`, 'GUIDE.2c-positive-continue');
      return R(B(xs >= 2 ? 4 : 5, xs), `Partner's ${plain(x)}: no room for 3NT, so game in ${SN[xs]}.`, 'GUIDE.2c-positive-continue');
    }
  }
  if (n === 4 && (gameBid(seq[3]) || seq[3] === '6N')) return AP('Partner chose the game.');
  return gap('The chart has no further calls after this 2♣ auction.');
}

function afterWeakTwo(seq, h) {
  const n = seq.length, p = hcp(h), M = ST.indexOf(seq[0][1]), t = L(h)[M], r = seq[1];
  if (n === 1) return wtResp(h, M);
  if (n === 2) {
    if (r === '2N') return wtAns(h, M);
    if (r === B(3, M) || r === B(4, M)) return AP('Partner raised: pass.');
    return gap('The chart has no further calls after a weak two here.');
  }
  // Responder after the answer to the 2NT ask. The chart stops here; trainer guides.
  if (n === 3 && r === '2N') {
    const a = seq[2], game = t >= 2 ? B(4, M) : '3N', where = t >= 2 ? `with ${t} ${SN[M]} the major is the game: ${plain(game)}` : `with only ${t} ${SN[M]}, ${plain(game)}`;
    if (a === '3N') return R('P', `Opener's 3NT shows a solid AKQ suit: that's the contract. Pass.`, 'GUIDE.weak-two-after-ask');
    if (a === B(3, M)) return p >= 17 ? R(game, `Opener's 3${SY[M]} shows a minimum or no feature. With ${p} (17+) there's still game; ${where}.`, 'GUIDE.weak-two-after-ask') : R('P', `Opener's 3${SY[M]} shows a minimum or no feature. With ${p} (14-16) game is unlikely: pass.`, 'GUIDE.weak-two-after-ask');
    return R(game, `Opener's ${plain(a)} shows a feature and a maximum (8-10), so bid game; ${where}.`, 'GUIDE.weak-two-after-ask');
  }
  if (n === 4 && gameBid(seq[3])) return AP('Partner chose the game.');
  return gap('The chart has no further calls after a weak two here.');
}

// Responder to a 3-level or 4-level pre-empt (chart E): change suit only if longer;
// with 3-4 top honours raise to game. Read here as 3+ aces and kings.
function afterPreempt(seq, h) {
  const n = seq.length, l = L(h), s = ST.indexOf(seq[0][1]), lv = +seq[0][0];
  if (n === 1) {
    const top = [0, 1, 2, 3].reduce((a, t) => a + (has(h, t, 14) ? 1 : 0) + (has(h, t, 13) ? 1 : 0), 0);
    if (l.some((n2, t) => t !== s && n2 >= lv + 5)) return gap('With a longer suit of your own, the chart says change suit, but not at what level.');
    if (top >= 3) return lv === 3 && s >= 2 ? R(B(4, s), `Partner's ${plain(seq[0])} is a pre-empt (7-card suit, 0-10). With ${top} aces and kings, raise to game: 4${SY[s]}.`, 'E.preempt-raise')
      : lv === 3 ? R('3N', `Partner's ${plain(seq[0])} is a pre-empt in a minor. With ${top} aces and kings, bid 3NT: partner's long suit should run.`, 'E.preempt-raise')
      : s < 2 ? R(B(5, s), `Partner's ${plain(seq[0])} is a pre-empt (8-card suit). With ${top} aces and kings, raise to game: 5${SY[s]}.`, 'E.preempt-raise')
      : R('P', `Partner's ${plain(seq[0])} is already game. With ${top} aces and kings there's no reason to bid on: pass.`, 'E.preempt-raise');
    return R('P', `Partner's ${plain(seq[0])} is a pre-empt (${lv + 4}-card suit, 0-10). You hold ${top === 0 ? 'no' : `only ${top}`} of the top honours (aces and kings) and no longer suit: pass.`, 'E.preempt-pass');
  }
  if (n === 2 && gameBid(seq[1])) return AP('Partner raised to game.');
  return gap('The chart has no further calls after a pre-empt.');
}

// The suit agreed when responder's suit (seq[1]) was raised by opener (seq[2]); else -1.
function raisedSuit(seq) {
  const r = seq[1], x = seq[2];
  if (!x || !/^\d[CDHS]$/.test(r) || !/^\d/.test(x)) return -1;
  return x[1] === r[1] && x !== r ? ST.indexOf(r[1]) : -1;
}
// Opener's answer when responder invites after opener's 1NT rebid (2NT) or simple raise (3M).
// The chart doesn't say; by analogy with chart C, accept with 13-14 (trainer guide).
function openerAfterInvite(h, seq) {
  const p = hcp(h), x = seq[2], a = seq[3], rs = raisedSuit(seq);
  const o = ST.indexOf(seq[0][1]), r = seq[1], l = L(h), as = /^\d[CDHS]$/.test(a) ? ST.indexOf(a[1]) : -1;
  const xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1, rsuit = /^\d[CDHS]$/.test(r) ? ST.indexOf(r[1]) : -1;
  const strongX = xs >= 0 && xs !== o && xs !== rsuit && bv(x) > bv(B(2, o));          // reverse or jump shift
  // After a reverse: responder's 6-9 sign-offs. Opener goes on with 17+.
  if (strongX && +x[0] === cheapest(xs, r)) {
    if (a === '2N' || (as >= 0 && +a[0] === 3 && as !== rsuit)) return p >= 17 ? R(as >= 2 ? B(4, as) : '3N', `Partner's ${plain(a)} shows 6-9. With ${p} (17+), bid game: ${as >= 2 ? plain(B(4, as)) : '3NT'}.`, 'D.reverse-continue') : R('P', `Partner's ${plain(a)} shows 6-9. With ${p} (15-16), pass.`, 'D.reverse-continue');
  }
  // 1m – 1M – 2NT (18-19) – 3M: five cards, forcing.
  if (x === '2N' && rsuit >= 2 && +r[0] === 1 && a === B(3, rsuit)) return l[rsuit] >= 3 ? R(B(4, rsuit), `Partner's 3${SY[rsuit]} shows five and asks: with ${l[rsuit]} ${SN[rsuit]}, bid 4${SY[rsuit]}.`, 'D.after-2nt-answer') : R('3N', `Partner's 3${SY[rsuit]} shows five ${SN[rsuit]}. With only ${l[rsuit]}, bid 3NT.`, 'D.after-2nt-answer');
  // 1x – 1M – 1NT – 3M: six cards, invitational.
  if (x === '1N' && rsuit >= 2 && a === B(3, rsuit)) return p >= 13 && l[rsuit] >= 2 ? R(B(4, rsuit), `Partner's 3${SY[rsuit]} invites with six. With ${p} (13-14) and ${l[rsuit]} ${SN[rsuit]}, accept: 4${SY[rsuit]}.`, 'GUIDE.invite-answer') : R('P', `Partner's 3${SY[rsuit]} invites. With ${p}${l[rsuit] < 2 ? ` and ${cardsOf(l[rsuit], rsuit)}` : ', a minimum'}, pass.`, 'GUIDE.invite-answer');
  // After a minimum rebid or a raise: 2NT or 3 of a suit invites (11-12). Accept with 13-14.
  const minRebid = x === '1N' || (xs >= 0 && bv(x) <= bv(B(2, o)) && !(+x[0] === 3));
  if (minRebid && (a === '2N' || (as >= 0 && +a[0] === 3 && as !== o || (as === o && x !== B(3, o))))) {
    if (a === '2N' && x === '1N') { /* handled below */ }
    else if (a === '2N') return p >= 13 ? R('3N', `Partner's 2NT invites (11-12). With ${p} (13-14), accept: 3NT.`, 'GUIDE.invite-answer') : R('P', `Partner's 2NT invites. With ${p}, a minimum, pass.`, 'GUIDE.invite-answer');
    else if (as >= 0 && as !== rs) {
      const game = as >= 2 ? B(4, as) : '3N';
      return p >= 13 ? R(game, `Partner's ${plain(a)} invites (11-12). With ${p} (13-14), accept: ${plain(game)}.`, 'GUIDE.invite-answer') : R('P', `Partner's ${plain(a)} invites. With ${p}, a minimum, pass.`, 'GUIDE.invite-answer');
    }
  }
  // After opener raised a minor: 2NT invites.
  if (xs >= 0 && xs === rsuit && rsuit < 2 && a === '2N') return p >= 13 ? R('3N', `Partner's 2NT invites (11-12). With ${p} (13-14), accept: 3NT.`, 'GUIDE.invite-answer') : R('P', `Partner's 2NT invites. With ${p}, pass.`, 'GUIDE.invite-answer');
  if (x === '1N' && a === '2N') return p >= 13 ? R('3N', `Partner's 2NT invites opposite your 12-14. With ${p} (13-14), accept: 3NT.`, 'GUIDE.invite-answer') : R('P', `Partner's 2NT invites opposite your 12-14. With ${p}, a minimum, pass.`, 'GUIDE.invite-answer');
  if (o >= 2 && x === B(2, o) && a === B(3, o)) return p >= 13 || losers(h) <= 6 ? R(B(4, o), `Partner's 3${SY[o]} invites opposite your 2${SY[o]} rebid. With ${p} HCP and ${losers(h)} losers, accept: 4${SY[o]}.`, 'GUIDE.invite-answer') : R('P', `Partner's 3${SY[o]} invites opposite your 2${SY[o]} rebid. With ${p}, a minimum, pass.`, 'GUIDE.invite-answer');
  if (rs >= 2 && +x[0] === 2 && a === B(3, rs)) return p >= 13 ? R(B(4, rs), `Partner's 3${SY[rs]} invites opposite your simple raise (11-14). With ${p} (13-14), accept: 4${SY[rs]}.`, 'GUIDE.invite-answer') : R('P', `Partner's 3${SY[rs]} invites opposite your simple raise (11-14). With ${p}, a minimum, pass.`, 'GUIDE.invite-answer');
  return undefined;
}
// Opener passes once responder has bid a game.
const gameBid = a => /^(3N|4[HS]|5[CD])$/.test(a);
// Responder gave preference to opener's first suit at the 2-level after a minimum rebid.
const preference = seq => seq[3] && seq[3][1] === seq[0][1] && +seq[3][0] === 2 && seq[2][1] !== seq[0][1];

function after1Major(seq, h) {
  const n = seq.length, p = hcp(h), M = ST.indexOf(seq[0][1]), r = seq[1];
  if (seq.includes('4N')) return afterRKCB(seq, h, raisedSuit(seq) >= 0 ? raisedSuit(seq) : M);
  if (n === 1) return r1M(h, M);
  if (n === 2) {   // opener's rebid
    if (r === B(2, M)) {
      // Partner's simple raise is about 9 losers. 24 − (yours + 9) = tricks.
      const k = losers(h), t = 24 - k - 9, lb = `${k} losers (${loserBreak(h)}): 24 − (${k} + 9) = ${t} tricks`;
      if (t >= 10 && p <= 18) return R(B(4, M), `Partner's 2${SY[M]} shows 6-9 with 3 trumps. You have ${p} HCP, but your shape counts: ${lb}, so bid 4${SY[M]}.`, 'B.after-raise');
      if (t === 9 && p <= 15) return R(B(3, M), `Partner's 2${SY[M]} shows 6-9. You have ${p} HCP, but ${lb}: try for game with 3${SY[M]}.`, 'B.after-raise');
    }
    if (r === B(2, M)) return p <= 15 ? R('P', `Partner's 2${SY[M]} shows 6-9 with 3 trumps. With ${p} (11-15), pass.`, 'B.after-raise') : p <= 18 ? R(B(3, M), `Partner's 2${SY[M]} shows 6-9. With ${p} (16-18), try for game with 3${SY[M]}.`, 'B.after-raise') : R(B(4, M), `Partner's 2${SY[M]} shows 6-9. With ${p} (19+), bid 4${SY[M]}.`, 'B.after-raise');
    if (r === B(3, M)) {
      const s = slamTry(h, M, 10, `Partner's limit raise (10-12)`);
      if (s) return s;
      if (p >= 15) return R(B(4, M), `Partner's 3${SY[M]} shows 10-12. With ${p} (15+), bid 4${SY[M]}.`, 'B.after-limit-raise');
      if (p <= 12) return losers(h) <= 6 ? R(B(4, M), `Partner's 3${SY[M]} shows 10-12 (about 8 losers). You have ${p} HCP but ${losers(h)} losers (${loserBreak(h)}): 24 − (${losers(h)} + 8) = ${16 - losers(h)} tricks, so bid 4${SY[M]}.`, 'B.after-limit-raise') : R('P', `Partner's 3${SY[M]} shows 10-12. With ${p} (11-12) and ${losers(h)} losers, pass.`, 'B.after-limit-raise');
      return ltcLimit(h, M);
    }
    if (r === '3D' && p <= 15 && losers(h) <= 5) return R(B(4, M), `Partner's 3♦ shows 4+ trumps, 7-9 (about 9 losers). You have ${p} HCP but ${losers(h)} losers (${loserBreak(h)}): 24 − (${losers(h)} + 9) = ${15 - losers(h)} tricks, so bid 4${SY[M]}.`, 'B.after-bergen');
    if (r === '3C' && p <= 13 && losers(h) <= 6 && !slamTry(h, M, 10, '')) return R(B(4, M), `Partner's 3♣ shows 4+ trumps, 10-12 (about 8 losers). You have ${p} HCP but ${losers(h)} losers (${loserBreak(h)}): 24 − (${losers(h)} + 8) = ${16 - losers(h)} tricks, so bid 4${SY[M]}.`, 'B.after-bergen');
    if (r === '3D') return p <= 15 ? R(B(3, M), `Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (11-15), sign off in 3${SY[M]}.`, 'B.after-bergen') : R(B(4, M), `Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (16+), bid 4${SY[M]}.`, 'B.after-bergen');
    if (r === '3C') return slamTry(h, M, 10, `Partner's 3♣ raise (10-12)`) || (p <= 13 ? R(B(3, M), `Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (11-13), sign off in 3${SY[M]}.`, 'B.after-bergen') : R(B(4, M), `Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (14+), bid 4${SY[M]}.`, 'B.after-bergen'));
    if (r === '2N') {
      // 18+ with 2+ key cards: 4NT at once (chart B). 18 + Jacoby's 13 = 31.
      if (p >= 18 && kcList(h, M).length >= 2) return slamTry(h, M, 13, `Partner's Jacoby 2NT (13+)`);
      return jac(h, M);
    }
    if (r === B(4, M)) return AP('Partner\'s weak 4-level raise is to play.');
    if (r === '1N') return rebidOver1NT(h, M);
    return rebid(h, M, ST.indexOf(r[1]), +r[0]);
  }
  if (n === 3 && r === '1N') return respOver1NTRebid(h, M, seq[2]);
  if (n === 4 && r === '1N') {
    const a = seq[3];
    if (a === '2N' || a === B(3, M)) return p >= 17 ? R(a === '2N' ? '3N' : B(4, M), `Partner's ${plain(a)} shows 6-7. With ${p} (17+), bid game.`, 'B.1nt-rebid') : R('P', `Partner's ${plain(a)} shows 6-7. With ${p}, pass.`, 'B.1nt-rebid');
    return AP('Partner chose the contract.');
  }
  if (n === 3) {   // responder's second call
    const x = seq[2];
    // Opener's game try shows about 6 losers: accept with 8 losers or fewer (24 − 14 = 10).
    if (r === B(2, M) && x === B(3, M) && p <= 7 && losers(h) <= 8) return R(B(4, M), `Opener's 3${SY[M]} is a game try (about 6 losers). You have ${p} HCP but ${losers(h)} losers (${loserBreak(h)}): 24 − (6 + ${losers(h)}) = ${18 - losers(h)} tricks, so accept with 4${SY[M]}.`, 'B.game-try-answer');
    if (r === B(2, M) && x === B(3, M)) return p <= 7 ? R('P', `Opener's 3${SY[M]} is a game try (16-18). With ${p} (6-7), pass.`, 'B.game-try-answer') : R(B(4, M), `Opener's 3${SY[M]} is a game try (16-18). With ${p} (8-9), accept with 4${SY[M]}.`, 'B.game-try-answer');
    if (r === '2N') return jacCont(h, M, x);
    if (/^(3[CD]|3[HS]|2[HS])$/.test(r) && (x === B(3, M) || x === B(4, M))) return AP('Opener signed off.');
    if (x === B(4, M)) return AP('Opener bid game.');
    // "New suit first, then support": keep the promise unless opener raised the new suit.
    if (x[1] !== r[1] && r1M(h, M).id === 'B.new-suit-then-support') return supportAfterNewSuit(h, M, r, x);
    return respAfterRebid(h, seq);
  }
  if (n === 4) {
    const a = seq[3], inv = openerAfterInvite(h, seq);
    if (/^2[CDHS]$/.test(a) && a[1] === seq[1][1] && seq[2][1] !== seq[1][1]) {   // responder rebid their own suit at the 2-level
      const rs = ST.indexOf(a[1]), xs2 = /^\d[CDHS]$/.test(seq[2]) ? ST.indexOf(seq[2][1]) : -1, o1 = ST.indexOf(seq[0][1]);
      const rev = xs2 >= 0 && xs2 !== o1 && bv(seq[2]) > bv(B(2, o1));
      if (rev && hcp(h) >= 17) return R(L(h)[rs] >= 3 && rs >= 2 ? B(4, rs) : '3N', `Partner's ${plain(a)} is a sign-off (6-9). With ${hcp(h)} (17+) after your reverse, bid game: ${L(h)[rs] >= 3 && rs >= 2 ? plain(B(4, rs)) : '3NT'}.`, 'D.reverse-continue');
      return R('P', `Partner's ${plain(a)} rebids their own suit: a sign-off. Pass.`, rev ? 'D.reverse-continue' : 'D.after-minimum');
    }
    if (preference(seq)) return AP('Partner gave preference to your first suit: pass.');
    if (inv !== undefined) return inv;
    if (gameBid(a)) return AP('Partner bid game.');
    return gap('The chart has no further calls in this auction.');
  }
  if (n === 5 && gameBid(seq[4])) return AP('Partner accepted the invitation.');
  return gap('The chart has no further calls in this auction.');
}

// 1♥/1♠ – 1NT (6-10, fewer than three trumps): opener's rebid.
function rebidOver1NT(h, M) {
  const p = hcp(h), l = L(h);
  const why = t => `Partner's 1NT shows 6-10 with fewer than three ${SN[M]}. ${t}`;
  if (isBal(h)) {
    if (p <= 16) return R('P', why(`Balanced ${p}: pass.`), 'B.1nt-rebid');
    if (p <= 18) return R('2N', why(`Balanced ${p} (17-18): invite with 2NT.`), 'B.1nt-rebid');
    return R('3N', why(`Balanced ${p} (19+): 3NT.`), 'B.1nt-rebid');
  }
  const second = [0, 1, 2, 3].filter(s => s !== M && l[s] >= 4).sort((a, b) => l[b] - l[a] || a - b)[0];
  if (p >= 20) {
    if (l[M] >= 6 || second === undefined) return R(B(4, M), why(`${p} (20+) with ${NUM[l[M]]} ${SN[M]}: 4${SY[M]}.`), 'B.1nt-rebid');
    return R(B(3, second), why(`${p} (20-22) with ${SN[second]}: jump shift to 3${SY[second]}, game forcing.`), 'B.1nt-rebid');
  }
  if (l[M] >= 6) return p >= 15 ? R(B(3, M), why(`${p} (15-19) with ${NUM[l[M]]} ${SN[M]}: jump to 3${SY[M]}.`), 'B.1nt-rebid') : R(B(2, M), why(`${p} (11-14) with ${NUM[l[M]]} ${SN[M]}: rebid 2${SY[M]}.`), 'B.1nt-rebid');
  if (second !== undefined && (second < M || p >= 15)) return R(B(2, second), why(`${p} with four+ ${SN[second]}: show them, 2${SY[second]}${second > M ? ' (a reverse, 15+)' : ''}.`), 'B.1nt-rebid');
  return R('P', why(`${p} with nothing more to show: pass.`), 'B.1nt-rebid');
}
// Responder (6-10, 0-2 trumps) after opener's rebid over 1NT.
function respOver1NTRebid(h, M, x) {
  const p = hcp(h), l = L(h), xs = /^\d[CDHS]$/.test(x) ? ST.indexOf(x[1]) : -1;
  if (x === '3N' || gameBid(x)) return AP('Opener bid game.');
  if (x === B(2, M)) return R('P', `Opener's 2${SY[M]} shows six and a minimum: pass.`, 'B.after-1nt-rebid');
  if (x === B(3, M)) return p >= 8 ? R(l[M] >= 2 ? B(4, M) : '3N', `Opener's 3${SY[M]} shows 15-19 with six. With ${p} (8-10), bid game: ${l[M] >= 2 ? `4${SY[M]}` : '3NT'}.`, 'B.after-1nt-rebid') : R('P', `Opener's 3${SY[M]} shows 15-19. With ${p} (6-7), pass.`, 'B.after-1nt-rebid');
  if (x === '2N') return p >= 8 ? R('3N', `Opener's 2NT invites (17-18). With ${p} (8-10), accept: 3NT.`, 'B.after-1nt-rebid') : R('P', `Opener's 2NT invites. With ${p} (6-7), pass.`, 'B.after-1nt-rebid');
  if (xs >= 0 && +x[0] === 3) return R('3N', `Opener's jump shift is game forcing (20-22): bid 3NT.`, 'B.after-1nt-rebid');
  if (xs > M) return p >= 8 ? R('3N', `Opener's 2${SY[xs]} is a reverse (15+). With ${p} (8-10), bid 3NT.`, 'B.after-1nt-rebid') : l[M] >= 2 ? R(B(3, M), `Opener's 2${SY[xs]} is a reverse (15+). With ${p} (6-7), give preference: 3${SY[M]}.`, 'B.after-1nt-rebid') : R('2N', `Opener's 2${SY[xs]} is a reverse. With ${p} (6-7), 2NT.`, 'B.after-1nt-rebid');
  if (xs >= 0) return l[M] >= 2 && l[M] >= l[xs] ? R(B(2, M), `Opener shows ${SN[xs]} too. With ${l[M]} ${SN[M]} and ${l[xs]} ${SN[xs]}, give preference: 2${SY[M]}.`, 'B.after-1nt-rebid') : R('P', `Opener shows ${SN[xs]}. With ${l[xs]} of them, pass.`, 'B.after-1nt-rebid');
  return gap('The chart has no call here.');
}

function after1Minor(seq, h) {
  const n = seq.length, p = hcp(h), m = ST.indexOf(seq[0][1]), r = seq[1];
  if (seq.includes('4N')) { const T = raisedSuit(seq); return T >= 0 ? afterRKCB(seq, h, T) : gap('The chart has no 4NT here.'); }
  if (n === 1) return r1m(h, m);
  if (n === 2) {   // opener's rebid
    if (r === '1N') {   // 1NT = 6-10 balanced, no 4-card major
      const l = L(h);
      if (isBal(h)) return p >= 18 && p <= 19 ? R('2N', `Balanced 18-19 after partner's 1NT: 2NT.`, 'C.after-1nt') : p >= 20 ? R('3N', `Balanced ${p} after partner's 1NT: 3NT.`, 'C.after-1nt') : R('P', `Balanced ${p}: partner's 1NT (6-10) is a fine contract. Pass.`, 'C.after-1nt');
      if (l[m] >= 6) return p >= 15 ? R(B(3, m), `${p} (15-19) with ${NUM[l[m]]} ${SN[m]}: jump to 3${SY[m]}.`, 'C.after-1nt') : R(B(2, m), `${p} (11-14) with ${NUM[l[m]]} ${SN[m]}: rebid 2${SY[m]}.`, 'C.after-1nt');
      const o2 = [0, 1].find(s => s !== m && l[s] >= 4);
      if (o2 !== undefined && (o2 < m || p >= 15)) return R(B(2, o2), `${p} with ${SN[o2]} too: 2${SY[o2]}.`, 'C.after-1nt');
      return R('P', `${p} with nothing more to show: pass partner's 1NT.`, 'C.after-1nt');
    }
    if (r === '2N') {
      if (!isBal(h)) {
        if (p >= 13) return R('3N', `Partner's 2NT shows 11-12. With ${p} (13+), bid 3NT.`, 'C.after-2nt');
        if (L(h)[m] >= 6) return R(B(3, m), `Partner's 2NT shows 11-12 balanced. With a minimum and ${NUM[L(h)[m]]} ${SN[m]}, sign off in 3${SY[m]}.`, 'C.after-2nt');
        return R('P', `Partner's 2NT shows 11-12. With ${p} (a minimum), pass.`, 'C.after-2nt');
      }
      return p <= 12 ? R('P', `Partner's 2NT shows 11-12. With ${p} (a minimum), pass.`, 'C.after-2nt') : R('3N', `Partner's 2NT shows 11-12. With ${p} (13+), bid 3NT.`, 'C.after-2nt');
    }
    if (r === '3N') return AP('Partner bid game.');
    return rebid(h, m, ST.indexOf(r[1]), +r[0]);
  }
  if (n === 3) {   // responder's second call
    const x = seq[2];
    // Same threshold as after 1m – 1M – 2NT: 18 + 7 = 25, enough for game.
    if (r === '1N' && x === '2N') return p >= 7 ? R('3N', `Opener's 2NT shows 18-19 balanced. With ${p} (7+), bid 3NT.`, 'C.after-1nt-2nt') : R('P', `Opener's 2NT shows 18-19. With only ${p}, pass.`, 'C.after-1nt-2nt');
    if (r === '2N' && x === '3N') return AP('Opener bid game.');
    return respAfterRebid(h, seq);
  }
  if (n === 4) {
    const a = seq[3], inv = openerAfterInvite(h, seq);
    if (/^2[CDHS]$/.test(a) && a[1] === seq[1][1] && seq[2][1] !== seq[1][1]) {   // responder rebid their own suit at the 2-level
      const rs = ST.indexOf(a[1]), xs2 = /^\d[CDHS]$/.test(seq[2]) ? ST.indexOf(seq[2][1]) : -1, o1 = ST.indexOf(seq[0][1]);
      const rev = xs2 >= 0 && xs2 !== o1 && bv(seq[2]) > bv(B(2, o1));
      if (rev && hcp(h) >= 17) return R(L(h)[rs] >= 3 && rs >= 2 ? B(4, rs) : '3N', `Partner's ${plain(a)} is a sign-off (6-9). With ${hcp(h)} (17+) after your reverse, bid game: ${L(h)[rs] >= 3 && rs >= 2 ? plain(B(4, rs)) : '3NT'}.`, 'D.reverse-continue');
      return R('P', `Partner's ${plain(a)} rebids their own suit: a sign-off. Pass.`, rev ? 'D.reverse-continue' : 'D.after-minimum');
    }
    if (preference(seq)) return AP('Partner gave preference to your first suit: pass.');
    if (inv !== undefined) return inv;
    if (gameBid(a)) return AP('Partner bid game.');
  }
  if (n === 5 && gameBid(seq[4])) return AP('Partner accepted the invitation.');
  return gap('The chart has no further calls in this auction.');
}

// The chart call for hand h after the partnership calls in seq, with the opponents silent.
// Returns R(...), or amb()/gap() if the chart stops.
function sysCall(seq, h) {
  const c = chartSysCall(seq, h);
  // Partner jumped to game on shape: pass.
  if (!isCall(c) && seq.length >= 2 && /^1[CDHS]$/.test(seq[0]) && /^(4[HS]|5[CD])$/.test(seq[seq.length - 1])) return AP('Partner bid game.');
  const r = fitGame(seq, h, c);
  // If the call the rules want has already been bid by partner (e.g. game), pass instead.
  const lb = [...seq].reverse().find(x => /^\d/.test(x));
  // Partner has just bid game (often on shape): pass rather than look for a lower call.
  if (isCall(r) && /^\d/.test(r.bid) && lb && bv(r.bid) < bv(lb) && lb === seq[seq.length - 1] && /^(3N|4[HS]|5[CD])$/.test(lb)) return AP('Partner bid game.');
  if (isCall(r) && /^\d/.test(r.bid) && lb && bv(r.bid) <= bv(lb)) {
    if (r.bid === lb) return R('P', `${r.why.replace(/:[^:]*$/, '').replace(/[,.]? *(bid game|so bid|bid)$/, '')}. Partner has already bid ${plain(lb)}, which is where you want to be: pass.`, r.id);
    return gap('The chart call is below the auction already reached.');
  }
  return r;
}

// ---------- Shape counts: game by losing trick count once a fit is found ----------
// After a 1-of-a-suit opening, work out what partner has shown (minimum length in each suit,
// and roughly how many losers), find any 8-card fit, and if 24 − (your losers + partner's)
// reaches game (10 tricks in a major, 11 in a minor), bid game even when points say stop.
const NAT = c => /^[1-7][CDHS]$/.test(c);
function partnerShows(seq) {
  const n = seq.length, len = [0, 0, 0, 0], popener = n % 2 === 1;
  const pIdx = [...seq.keys()].filter(i => (n - i) % 2 === 1);
  const o = ST.indexOf(seq[0][1]);
  let los = popener ? 7 : 9;
  for (const i of pIdx) {
    const c = seq[i];
    if (!NAT(c)) {
      if (c === '2N' && i === 2) los = 6;                       // opener's 18-19 2NT rebid
      continue;
    }
    const s = ST.indexOf(c[1]), lv = +c[0];
    if (i === 0) { len[s] = s >= 2 ? 5 : s === 1 ? 4 : 3; continue; }
    if (i === 1 && o >= 2 && (c === '3C' || c === '3D')) { len[o] = 4; los = c === '3C' ? 8 : 9; continue; }   // Bergen
    const ours = seq.some((x, j) => (n - j) % 2 === 0 && NAT(x) && x[1] === c[1]);
    const mine = pIdx.some(j => j < i && NAT(seq[j]) && seq[j][1] === c[1]);
    if (ours) { len[s] = Math.max(len[s], popener ? 4 : 3); }   // a raise of our suit
    else if (mine) { len[s] = Math.max(len[s] + 1, s >= 2 ? 6 : 5); }   // rebid of their own suit
    else len[s] = Math.max(len[s], 4);                             // a new suit
    // Strength: jumps and reverses show extras.
    const prev = seq[i - 1], cheapLv = prev && NAT(prev) ? cheapest(s, prev) : 1;
    if (popener && i === 2) { if (lv > cheapLv) los = lv >= cheapLv + 1 && !ours && !mine ? 5 : 6; else if (!ours && !mine && bv(c) > bv(B(2, o))) los = 6; }
    if (!popener && i === 1) los = ours ? (lv >= 3 ? 8 : 9) : (lv >= 2 ? 8 : 9);
  }
  return { len, los };
}
function fitGame(seq, h, c) {
  if (!isCall(c) || !c.bid || seq.length < 2 || !/^1[CDHS]$/.test(seq[0]) || seq.includes('4N')) return c;
  if (/^(G\.|B\.jacoby|B\.bergen|B\.new-suit-then-support|LTC\.)/.test(c.id || '') || c.bid === '4N') return c;
  const last = seq[seq.length - 1];
  if (last === 'P' || /^(3N|4[HS]|5[CD])$/.test(last) || /^[67]/.test(last)) return c;
  const b = c.bid;
  if (/^([45][CDHS]|[3-7]N|[67][CDHS])$/.test(b) && !/^4[CD]$/.test(b)) return c;   // already game or higher
  const { len, los } = partnerShows(seq), l = L(h), k = losers(h);
  const lastBid = [...seq].reverse().find(NAT) || '1C';
  const fits = [3, 2, 1, 0].filter(s => len[s] + l[s] >= 8);
  for (const s of fits) {
    const game = s >= 2 ? 4 : 5, t = 24 - k - los;
    if (t < game + 6) continue;
    if (s <= 1 && b === '3N') continue;
    const g = B(game, s);
    if (bv(g) <= bv(lastBid)) continue;
    return R(g, `${len[s]}+ ${SN[s]} shown by partner and ${l[s]} in your hand: a ${len[s] + l[s]}-card fit. Count losers: yours ${k} (${loserBreak(h)}), partner's about ${los}. 24 − (${k} + ${los}) = ${t} tricks, enough for ${plain(g)}. With a fit, shape counts more than points.`, 'LTC.fit-game');
  }
  return c;
}

function chartSysCall(seq, h) {
  const n = seq.length;
  if (n === 0) return openingBid(h);
  const o = seq[0];
  // After a pass, partner may pass too (the hand is passed out). The chart has no
  // passed-hand auctions, so an opening in second or fourth seat stops the auction.
  if (o === 'P') {
    if (n > 1) return gap('The chart has no passed-hand auctions.');
    const c = openingBid(h);
    return isCall(c) && c.bid === 'P' ? c : gap('The chart has no auctions where one partner passes and the other then opens.');
  }
  if (n >= 2 && seq[n - 1] === 'P') return gap('The chart has no call after a pass.');
  if (o === '1N') return after1NT(seq, h);
  if (o === '2N') return nt2(seq, h, 3);
  if (o === '2C') return after2C(seq, h);
  if (o === '2H' || o === '2S') return afterWeakTwo(seq, h);
  if (o === '1H' || o === '1S') return after1Major(seq, h);
  if (o === '1C' || o === '1D') return after1Minor(seq, h);
  if (/^[34][CDHS]$/.test(o)) return afterPreempt(seq, h);
  return gap('The chart has no auctions after this opening.');
}

// ---------- The whole auction: all four seats ----------
const SEATS4 = ['W', 'N', 'E', 'S'];
// The seat k places after `seat` in bidding order: 1 = left-hand opponent, 2 = partner, 3 = right-hand opponent.
const seatAfter = (seat, k) => SEATS4[(SEATS4.indexOf(seat) + k) % 4];

// The auction as the player about to call sees it. `calls` runs from the dealer, all four seats.
function auctionState(dealer, calls) {
  const seat = seatAfter(dealer, calls.length), partner = seatAfter(seat, 2);
  const ourSide = s => s === seat || s === partner;
  const tagged = calls.map((call, i) => ({ call, by: seatAfter(dealer, i) }));
  return {
    dealer, calls, seat, partner, lho: seatAfter(seat, 1), rho: seatAfter(seat, 3),
    tagged,                                                     // [{ call, by }], in bidding order
    ours: tagged.filter(x => ourSide(x.by)).map(x => x.call),   // our side's calls (the partnership sequence)
    theirs: tagged.filter(x => !ourSide(x.by)).map(x => x.call),
    contested: tagged.some(x => !ourSide(x.by) && x.call !== 'P'),
  };
}

// Contested auctions. Chart F covers only your first call after the other side opens.
function competitive(st, h) {
  const { tagged, seat, partner, lho, rho } = st;
  if (tagged.some(x => x.by === seat)) return gap('Once the opponents have bid, the chart covers only the first call over them.');
  const bids = tagged.filter(x => x.call !== 'P'), open = bids[0], last = tagged[tagged.length - 1];
  const oneSuit = c => /^1[CDHS]$/.test(c), suit = c => ST.indexOf(c[1]);
  // RHO has just opened: overcall, takeout double, Michaels, Unusual 2NT, or Cappelletti over 1NT.
  if (bids.length === 1 && open.by === rho && last === open) {
    if (open.call === '1N') return vs1NT(h);
    if (oneSuit(open.call)) return overcall(h, suit(open.call));
  }
  // Partner opened 1 of a suit and RHO has just overcalled at the 1-level: negative double.
  if (bids.length === 2 && open.by === partner && oneSuit(open.call) && bids[1].by === rho && oneSuit(bids[1].call) && last === bids[1]) {
    return negDbl(h, suit(open.call), suit(bids[1].call));
  }
  // LHO opened 1 of a suit, partner made a weak jump overcall, RHO passed: raise to the level of the fit.
  if (bids.length === 2 && open.by === lho && oneSuit(open.call) && bids[1].by === partner && last.by === rho && last.call === 'P' && /^[23][CDHS]$/.test(bids[1].call)) {
    const ov = bids[1].call, y = suit(ov), x = suit(open.call);
    if (+ov[0] === (y > x ? 2 : 3)) return wjoRaise(h, x, ov);
  }
  // LHO opened 1 of a suit, partner doubled for takeout, RHO passed: advance the double.
  if (bids.length === 2 && open.by === lho && oneSuit(open.call) && bids[1].by === partner && bids[1].call === 'X' && last.by === rho && last.call === 'P') {
    return advance(h, suit(open.call));
  }
  return gap('The chart has no call for this contested auction.');
}

// The chart call for the player about to call, given the whole auction so far.
function chartCall(st, h) {
  return st.contested ? competitive(st, h) : sysCall(st.ours, h);
}

// The auction is over after four passes, or after a bid followed by three passes.
const auctionOver = calls => calls.length >= 4 && calls.slice(-3).every(c => c === 'P');

// Play out a whole auction. South is the user; North is partner. East and West call
// with opponents(state), which returns a call; by default they always pass.
// Returns calls (all four seats, from the dealer), steps (South's non-automatic calls,
// each with the auction so far), pn (North's calls with reasons), the final contract
// (null unless the auction ended), and stop: the amb()/gap() that ended it early, with the
// seat that had no call.
function simulate(hS, hN, dealer, note, opponents) {
  const calls = [], steps = [], pn = [];
  let stop = null;
  while (!auctionOver(calls) && calls.length < 60) {
    const st = auctionState(dealer, calls), seat = st.seat;
    if (seat === 'E' || seat === 'W') { calls.push(opponents ? opponents(st) : 'P'); continue; }
    const a = chartCall(st, seat === 'S' ? hS : hN);
    if (!isCall(a)) { stop = { ...a, seat }; break; }
    if (seat === 'S' && !a.auto) steps.push({ calls: calls.slice(), ans: a, note: steps.length ? `Partner bid ${plain(st.ours[st.ours.length - 1])}.` : note });
    if (seat === 'N') pn.push({ call: a.bid, why: a.why, auto: !!a.auto });
    calls.push(a.bid);
  }
  const contract = auctionOver(calls) ? [...calls].reverse().find(c => /^[1-7]/.test(c)) || null : null;
  return { calls, steps, pn, contract, stop };
}

// ---------- Four-hand drills: the opponents bid by script ----------
const WHO = { W: 'LHO', E: 'RHO', N: 'partner', S: 'you' };
// "Then: LHO pass, partner 2♥, RHO pass." for the calls since South's last call.
function since(calls, from, dealer) {
  const p = [];
  for (let i = from + 1; i < calls.length; i++) p.push(`${WHO[seatAfter(dealer, i)]} ${plain(calls[i])}`);
  return p.length ? `Then: ${p.join(', ')}.` : '';
}
// Play a scripted four-hand auction (contested.js). H = {N, E, S, W} hands. F(seat, calls, hand, n)
// returns each call (n = calls so far): our side's from the rules, the opponents' from a script.
// Anything but a call (null, amb(), gap()) abandons the deal. Returns a question like
// simulate()'s, plus on (opponents' calls with reasons), cdbl ('X' or 'XX' if the contract is
// doubled) and ours (false if the opponents play it).
function sim4(H, dealer, F, note) {
  const calls = [], steps = [], pn = [], on = [];
  let lastS = -1;
  while (!auctionOver(calls) && calls.length < 40) {
    const seat = seatAfter(dealer, calls.length), a = F(seat, calls, H[seat], calls.length);
    if (!isCall(a)) return null;
    if (seat === 'S') {
      if (!a.auto) steps.push({ calls: calls.slice(), ans: a, note: steps.length ? since(calls, lastS, dealer) : note });
      lastS = calls.length;
    } else if (seat === 'N') pn.push({ call: a.bid, why: a.why, auto: !!a.auto });
    else if (!a.auto) on.push({ seat, call: a.bid, why: a.why });
    calls.push(a.bid);
  }
  if (!auctionOver(calls) || !steps.length) return null;
  const lb = lastBid(calls);
  let cdbl = '', ours = true;
  if (lb) {
    const i = calls.lastIndexOf(lb), d = calls.slice(i + 1).filter(x => x === 'X' || x === 'XX');
    cdbl = d.length ? d[d.length - 1] : '';
    ours = 'NS'.includes(seatAfter(dealer, i));
  }
  return { dealer, hand: H.S, partner: H.N, steps, calls, pn, on, contract: lb || null, cdbl, ours, stop: null };
}
