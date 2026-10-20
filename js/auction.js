// Full-auction bidder: decides which chart rule applies at each point, then plays a
// whole auction with both partners following the chart. Opponents always pass.
//
// `seq` is the partnership's calls only (opponents' passes are left out), so
// seq[0] is the opening, seq[1] the response, seq[2] opener's rebid, and so on.
'use strict';

// An automatic pass (partner has placed the contract). Auto calls are never asked of the user.
const AP = why => ({ bid: 'P', why, ref: '', auto: true });

// The 2NT structure, shared by a 2NT opening (pm = 3) and 2♣-2♦-2NT (pm = 1).
// seq starts at the 2NT bid.
function nt2(seq, h, pm) {
  const n = seq.length, r = seq[1], l = L(h), p = hcp(h);
  if (n === 1) return over2Nx(h, pm);
  if (n === 2) {
    if (r === '3C') return l[2] >= 4 ? R('3H', 'Answering 3♣ Stayman: four hearts, 3♥.', 'E') : l[3] >= 4 ? R('3S', 'Answering 3♣ Stayman: four spades, 3♠.', 'E') : R('3D', 'Answering 3♣ Stayman: no 4-card major, 3♦.', 'E');
    if (r === '3D') return R('3H', '3♦ is a transfer: complete it with 3♥.', 'E');
    if (r === '3H') return R('3S', '3♥ is a transfer: complete it with 3♠.', 'E');
    if (r === '4D') return R('4H', 'Texas: complete to 4♥.', 'E');
    if (r === '4H') return R('4S', 'Texas: complete to 4♠.', 'E');
    if (r === '3N') return AP('Partner bid game.');
    return null;
  }
  if (n === 3) {
    if (r === '3C') {
      const a = seq[2];
      if (a === '3H') return l[2] >= 4 ? R('4H', 'Opener has four hearts and so do you: 4♥.', 'E') : R('3N', 'No heart fit: 3NT.', 'E');
      if (a === '3S') return l[3] >= 4 ? R('4S', 'Opener has four spades and so do you: 4♠.', 'E') : R('3N', 'No spade fit: 3NT.', 'E');
      return R('3N', 'Opener has no 4-card major: 3NT.', 'E');
    }
    if (r === '3D' || r === '3H') {
      const M = r === '3D' ? 2 : 3;
      if (p <= pm) return R('P', `${p} HCP: pass the completion.`, 'E');
      return R(B(4, M), `${p} HCP: raise to 4${SY[M]}.`, 'E');
    }
    if (r === '4D' || r === '4H') return R('P', 'Texas was a sign-off: pass.', 'E');
    return null;
  }
  if (n === 4) {
    const a = seq[3];
    if (a === '3N' || /^4[HS]$/.test(a)) return AP('Partner chose the contract.');
  }
  return null;
}

// ---------- One function per opening bid ----------
function after1NT(seq, h) {
  const n = seq.length, p = hcp(h), l = L(h), r = seq[1];
  if (n === 1) return r1NT(h);
  if (n === 2) {
    switch (r) {
      case '2C': return stayAns(h);
      case '2D': return R('2H', '2♦ is a transfer: complete it with 2♥.', 'A');
      case '2H': return R('2S', '2♥ is a transfer: complete it with 2♠.', 'A');
      case '4D': return R('4H', 'Texas: complete to 4♥.', 'A');
      case '4H': return R('4S', 'Texas: complete to 4♠.', 'A');
      case '2S': return rangeAns(h);
      case '2N': return inv(h);
      case '4N': return p <= 15 ? R('P', '15 HCP is a minimum: pass the quantitative 4NT.', 'A') : R('6N', `${p} HCP is a maximum (16-17): bid 6NT.`, 'A');
      case '3N': return AP('Partner bid game.');
    }
    return null;
  }
  if (n === 3) {
    const a = seq[2];
    if (r === '2C') return afterStay(h, a);
    if (r === '2D') return afterXfer(h, 2);
    if (r === '2H') return afterXfer(h, 3);
    if (r === '2S') return rangeResp(h, a);
    if (r === '4D' || r === '4H') return R('P', 'Texas was a sign-off: pass.', 'A');
    return null;
  }
  if (n === 4) {   // opener's third call
    const rep = seq[2], a = seq[3];
    if (r === '2C') {
      if (rep === '2D') {
        if (a === '2N') return inv(h);
        if (a === '3H') return smolenAns(h, 3);
        if (a === '3S') return smolenAns(h, 2);
        if (a === '3N' || a === '2H' || a === '2S') return AP('Partner signed off.');
        return null;
      }
      if (rep === '2H') {
        if (a === '3H') return inv4(h, 2);
        if (a === '2N') return l[3] >= 4 ? null : inv(h);
        if (a === '2S') return l[3] >= 4 ? R('4S', 'Partner\'s 2♠ shows four spades, game forcing. You have four: 4♠.', 'A') : R('3N', 'Partner\'s 2♠ shows four spades, game forcing. You have fewer than four: 3NT.', 'A');
        if (a === '4H' || a === '3N') return AP('Partner bid game.');
        return null;
      }
      if (rep === '2S') {
        if (a === '3S') return inv4(h, 3);
        if (a === '2N') return inv(h);
        if (a === '4S' || a === '3N') return AP('Partner bid game.');
        return null;
      }
    }
    if (r === '2D' || r === '2H') {
      const M = r === '2D' ? 2 : 3;
      if (a === '2N') return l[M] >= 3 ? null : inv(h);
      if (a === B(3, M)) return inv4(h, M);
      if (a === '3N') return l[M] >= 3 ? R(B(4, M), `Partner showed five ${SN[M]} and 10-14. With ${l[M]} ${SN[M]}, correct to 4${SY[M]}.`, 'A') : R('P', `Partner showed five ${SN[M]}. With only ${l[M]}, pass 3NT.`, 'A');
      return null;
    }
    if (r === '2S' && (a === '3N' || a === '3C' || a === '3D')) return AP('Partner chose the contract.');
    return null;
  }
  if (n === 5) {
    const b = seq[4];
    if (b === '3N' || /^4[HS]$/.test(b)) return AP('Partner chose the contract.');
  }
  return null;
}

function after2C(seq, h) {
  const n = seq.length;
  if (n === 1) return over2C(h);
  if (seq[1] !== '2D') return null;
  if (n === 2) return twoClubRebid(h);
  if (seq[2] === '2N') return nt2(seq.slice(2), h, 1);
  return null;
}

function afterWeakTwo(seq, h) {
  const n = seq.length, M = ST.indexOf(seq[0][1]), r = seq[1];
  if (n === 1) return wtResp(h, M);
  if (n === 2) {
    if (r === '2N') return wtAns(h, M);
    if (r === B(3, M) || r === B(4, M)) return AP('Partner raised: pass.');
  }
  return null;
}

function after1Major(seq, h) {
  const n = seq.length, p = hcp(h), M = ST.indexOf(seq[0][1]), r = seq[1];
  if (n === 1) return r1M(h, M);
  if (n === 2) {   // opener's rebid
    if (r === B(2, M)) return p <= 15 ? R('P', `Partner's 2${SY[M]} shows 6-9 with 3 trumps. With ${p} (11-15), pass.`, 'B') : p <= 18 ? R(B(3, M), `Partner's 2${SY[M]} shows 6-9. With ${p} (16-18), try for game with 3${SY[M]}.`, 'B') : R(B(4, M), `Partner's 2${SY[M]} shows 6-9. With ${p} (19+), bid 4${SY[M]}.`, 'B');
    if (r === B(3, M)) return p >= 15 ? R(B(4, M), `Partner's 3${SY[M]} shows 10-12. With ${p} (15+), bid 4${SY[M]}.`, 'B') : p <= 12 ? R('P', `Partner's 3${SY[M]} shows 10-12. With ${p} (11-12), pass.`, 'B') : null;
    if (r === '3D') return p <= 15 ? R(B(3, M), `Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (11-15), sign off in 3${SY[M]}.`, 'B') : R(B(4, M), `Partner's 3♦ shows 4+ trumps, 7-9. With ${p} (16+), bid 4${SY[M]}.`, 'B');
    if (r === '3C') return p <= 13 ? R(B(3, M), `Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (11-13), sign off in 3${SY[M]}.`, 'B') : R(B(4, M), `Partner's 3♣ shows 4+ trumps, 10-12. With ${p} (14+), bid 4${SY[M]}.`, 'B');
    if (r === '2N') return jac(h, M);
    if (r === B(4, M)) return AP('Partner\'s weak 4-level raise is to play.');
    if (r === '1N') return null;
    return rebid(h, M, ST.indexOf(r[1]), +r[0]);
  }
  if (n === 3) {   // responder's second call
    const x = seq[2];
    if (r === B(2, M) && x === B(3, M)) return p <= 7 ? R('P', `Opener's 3${SY[M]} is a game try (16-18). With ${p} (6-7), pass.`, 'B') : R(B(4, M), `Opener's 3${SY[M]} is a game try (16-18). With ${p} (8-9), accept with 4${SY[M]}.`, 'B');
    if (r === '2N') return jacCont(h, M, x);
    if (/^(3[CD]|3[HS]|2[HS])$/.test(r) && (x === B(3, M) || x === B(4, M))) return AP('Opener signed off.');
    if (x === B(4, M)) return AP('Opener bid game.');
    return respAfterRebid(h, seq);
  }
  if (n === 4) {
    const a = seq[3];
    if (r === '2N' && a === '4N') return rkReply(h, M);
    if (a === B(4, M) || a === '3N') return AP('Partner bid game.');
    return null;
  }
  if (n === 5 && r === '2N' && seq[3] === '4N') return askDecide(h, M, seq[4]);
  if (n === 6 && r === '2N' && (seq[5] === B(5, M) || seq[5] === B(6, M))) return AP('Partner signed off after RKCB.');
  return null;
}

function after1Minor(seq, h) {
  const n = seq.length, p = hcp(h), m = ST.indexOf(seq[0][1]), r = seq[1];
  if (n === 1) return r1m(h, m);
  if (n === 2) {   // opener's rebid
    if (r === '1N') return isBal(h) && p >= 18 && p <= 19 ? R('2N', `Balanced 18-19 after partner's 1NT: 2NT.`, 'C') : null;
    if (r === '2N') {
      if (!isBal(h)) return null;
      return p <= 12 ? R('P', `Partner's 2NT shows 11-12. With ${p} (a minimum), pass.`, 'C') : R('3N', `Partner's 2NT shows 11-12. With ${p} (13+), bid 3NT.`, 'C');
    }
    if (r === '3N') return AP('Partner bid game.');
    return rebid(h, m, ST.indexOf(r[1]), +r[0]);
  }
  if (n === 3) {   // responder's second call
    const x = seq[2];
    if (r === '1N' && x === '2N') return p <= 7 ? R('P', `Opener's 2NT shows 18-19. With ${p} (6-7), pass.`, 'C') : R('3N', `Opener's 2NT shows 18-19. With ${p} (8-10), bid 3NT.`, 'C');
    if (r === '2N' && x === '3N') return AP('Opener bid game.');
    return respAfterRebid(h, seq);
  }
  if (n === 4) {
    const a = seq[3];
    if (a === '3N' || /^4[HS]$/.test(a)) return AP('Partner bid game.');
  }
  return null;
}

// The chart call for hand h after the partnership calls in seq, or null if the chart stops.
function sysCall(seq, h) {
  const n = seq.length;
  if (n === 0) return openingBid(h);
  const o = seq[0];
  // After a pass, partner may pass too (the hand is passed out). The chart has no
  // passed-hand auctions, so an opening in second or fourth seat stops the auction.
  if (o === 'P') {
    if (n > 1) return null;
    const c = openingBid(h);
    return c && c.bid === 'P' ? c : null;
  }
  if (n >= 2 && seq[n - 1] === 'P') return null;
  if (o === '1N') return after1NT(seq, h);
  if (o === '2N') return nt2(seq, h, 3);
  if (o === '2C') return after2C(seq, h);
  if (o === '2H' || o === '2S') return afterWeakTwo(seq, h);
  if (o === '1H' || o === '1S') return after1Major(seq, h);
  if (o === '1C' || o === '1D') return after1Minor(seq, h);
  return null;
}

// Play out a whole auction. South is the user; North is partner.
// Returns calls (all four seats, from the dealer), steps (South's non-automatic calls,
// each with the auction so far), pn (North's calls with reasons) and the final contract.
const SEATS4 = ['W', 'N', 'E', 'S'];
function simulate(hS, hN, dealer, note) {
  let si = SEATS4.indexOf(dealer);
  const calls = [], seq = [], steps = [], pn = [];
  let ended = false;
  for (let g = 0; g < 40; g++) {
    const seat = SEATS4[si];
    if (seat === 'E' || seat === 'W') { calls.push('P'); si = (si + 1) % 4; continue; }
    const a = sysCall(seq, seat === 'S' ? hS : hN);
    if (!a) break;
    if (seat === 'S' && !a.auto) steps.push({ calls: calls.slice(), ans: a, note: steps.length ? `Partner bid ${plain(seq[seq.length - 1])}.` : note });
    if (seat === 'N') pn.push({ call: a.bid, why: a.why, auto: !!a.auto });
    calls.push(a.bid);
    seq.push(a.bid);
    if (a.bid === 'P' && seq.length > 1) { ended = true; break; }   // an opening pass lets partner speak
    si = (si + 1) % 4;
  }
  let contract = null;
  if (ended) {
    const b = [...seq].reverse().find(c => c !== 'P');
    contract = b || null;
    if (!contract) calls.push('P');   // passed out: show the fourth pass
  }
  return { calls, steps, pn, contract };
}
