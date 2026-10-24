// Competitive bidding (chart sections F and H): overcalls, doubles, Cappelletti, and what
// both sides do once the opponents are in the auction. Same conventions as rules.js:
// each function returns R(bid, why, ruleId), or amb(why) / gap(why) when the chart gives no
// single call.
'use strict';

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
// A 4-card major goes ahead of a longer minor; with 12+, cue-bid their suit (game forcing).
function advance(h, x) {
  const p = hcp(h), l = L(h), un = [0, 1, 2, 3].filter(s => s !== x);
  if (p > 15) return gap('The chart has no advance with 16+.');
  if (p >= 12) {
    const cue = B(2, x);
    return R(cue, `${p} HCP (12+): cue-bid their suit, ${plain(cue)}. It is game forcing and asks partner to describe: a 4-card major first, else 2NT with a ${SN[x]} stopper, else a minor. Then you choose the game.`, 'F.advance-cue');
  }
  const majors = [2, 3].filter(s => s !== x && l[s] >= 4);
  let s, why;
  if (majors.length) {
    const mx = Math.max(...majors.map(t => l[t])), top = majors.filter(t => l[t] === mx);
    if (top.length > 1) return amb('With 4-4 in the majors, the chart does not say which major to bid.');
    s = top[0];
    why = `${l[s]} ${SN[s]}: partner's double promises support for the unbid major${x >= 2 ? '' : 's'}, so bid ${SN[s]} ahead of any longer minor`;
  } else {
    const mx = Math.max(...un.map(t => l[t])), longs = un.filter(t => l[t] === mx);
    if (longs.length > 1) return amb('Two longest suits of equal length: the chart does not say which to bid.');
    s = longs[0];
    why = `no 4-card major, so bid your longest suit, ${SN[s]}`;
  }
  const lv = s > x ? 1 : 2;
  if (p <= 8) return R(B(lv, s), `${p} HCP (0-8): ${why}, at the lowest level: ${plain(B(lv, s))}. Never pass a takeout double.`, 'F.advance-min');
  return R(B(lv + 1, s), `${p} HCP (9-11): ${why}, with a jump: ${plain(B(lv + 1, s))}.`, 'F.advance-jump');
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


// ---------- F: the cue bid after partner's takeout double ----------
// Doubler answers advancer's cue bid: a 4-card major (up the line), else 2NT with a stopper
// in their suit x, else the longest minor.
function cueAnswer(h, x, calls) {
  const l = L(h), cue = lastBid(calls), ms = [2, 3].filter(s => s !== x && l[s] >= 4);
  if (ms.length) {
    const s = ms[0], b = B(cheapest(s, cue), s);
    return R(b, `Partner's cue bid shows 12+ and forces to game. Show your 4-card major${ms.length > 1 ? 's up the line, hearts first' : ''}: ${plain(b)}.`, 'F.cue-answer');
  }
  if (stop(h, x)) {
    const b = B(cheapest(4, cue), 4);
    return R(b, `Partner's cue bid shows 12+. No 4-card major, but a ${SN[x]} stopper: ${plain(b)}.`, 'F.cue-answer');
  }
  const mn = [0, 1].filter(s => s !== x), s = mn.length > 1 && l[mn[1]] > l[mn[0]] ? mn[1] : mn[0], b = B(cheapest(s, cue), s);
  return R(b, `Partner's cue bid shows 12+. No 4-card major and no ${SN[x]} stopper: show your longest minor, ${plain(b)}.`, 'F.cue-answer');
}
// Advancer with a 5-card major not yet shown: bid it at the 3-level (forcing), or 4 if no room.
function showMajor(h, x, ans, om) {
  const l = L(h), b3 = B(3, om);
  if (bv(b3) > bv(ans)) return R(b3, `You have ${l[om]} ${SN[om]}. Bid ${plain(b3)}: natural and forcing (the cue bid set up a game force). Partner bids 4${SY[om]} with three or more, or 3NT with only two and a ${SN[x]} stopper.`, 'F.cue-major');
  return R(B(4, om), `You have ${l[om]} ${SN[om]} and no room to show them below game, and partner's double promised at least three: 4${SY[om]}.`, 'F.cue-major');
}
// Advancer places the contract after the doubler's answer `ans`.
function cuePlace(h, x, ans) {
  const l = L(h), s = ST.indexOf(ans[1]), st = stop(h, x);
  if (s >= 2 && s < 4) {
    if (l[s] >= 4) return R(B(4, s), `Partner shows four ${SN[s]} and so do you: game in the major, ${plain(B(4, s))}.`, 'F.cue-place');
    const om = [2, 3].find(t => t !== x && t !== s && l[t] >= 5);
    if (om !== undefined) return showMajor(h, x, ans, om);
    if (st) return R('3N', `Partner's ${plain(ans)} doesn't fit you, but you hold a ${SN[x]} stopper: 3NT.`, 'F.cue-place');
    if (l[s] === 3) return R(B(4, s), `Partner shows four ${SN[s]}; you have three. With no ${SN[x]} stopper, the 4-3 fit is the best game: ${plain(B(4, s))}.`, 'F.cue-place');
    return gap('No fit and no stopper after the cue bid: the chart gives no game.');
  }
  const om = [2, 3].find(t => t !== x && l[t] >= 5);
  if (om !== undefined) return showMajor(h, x, ans, om);
  if (ans === '3N') return R('P', `Partner bid 3NT: no 4-card major and a stopper. Pass.`, 'F.cue-place');
  if (ans === '2N') return R('3N', `Partner has no 4-card major but a ${SN[x]} stopper: 3NT.`, 'F.cue-place');
  if (st) return R('3N', `Partner shows ${SN[s]} without a major or a ${SN[x]} stopper; you have the stopper: 3NT.`, 'F.cue-place');
  if (l[s] >= 4) return R(B(5, s), `Partner shows ${SN[s]}, you have ${l[s]}, and nobody has a ${SN[x]} stopper: 5${SY[s]}.`, 'F.cue-place');
  return gap('No fit and no stopper after the cue bid: the chart gives no game.');
}
// Doubler after advancer shows a 5-card major at the 3-level.
function cueRaise(h, x, bid) {
  const l = L(h), s = ST.indexOf(bid[1]);
  if (l[s] >= 3) return R(B(4, s), `Partner's ${plain(bid)} shows five or more ${SN[s]}, forcing. With ${l[s]} you have a fit: 4${SY[s]}.`, 'F.cue-raise');
  if (stop(h, x)) return R('3N', `Partner's ${plain(bid)} shows five ${SN[s]}, but you have only ${l[s]} and a ${SN[x]} stopper: 3NT.`, 'F.cue-raise');
  return R(B(4, s), `Partner's ${plain(bid)} shows five ${SN[s]}. With no ${SN[x]} stopper, the 5-2 fit is still the best game: 4${SY[s]}.`, 'F.cue-raise');
}

// ---------- F and H: penalty doubles, the trap pass, reopening ----------
// A trump stack in suit s: 4+ cards with two of the top five honours, including A, K or Q.
const stack = (h, s) => h[s].length >= 4 && [14, 13, 12, 11, 10].filter(r => has(h, s, r)).length >= 2 && [14, 13, 12].some(r => has(h, s, r));
// RHO overcalled partner's 1-level opening with 1NT.
function dblNTOvercall(h) {
  const p = hcp(h);
  return p >= 8 ? R('X', `RHO overcalled 1NT. With ${p} HCP (8+), double for penalties: your side has the balance of the points.`, 'F.penalty-double-nt')
    : R('P', `Only ${p} HCP. A penalty double of a 1NT overcall needs 8+, so pass.`, 'F.penalty-double-nt');
}
// RHO jumped to the 4-level over partner's opening.
function dbl4Level(h, ov) {
  const p = hcp(h);
  return p >= 8 ? R('X', `RHO jumped to ${plain(ov)}. A double of an overcall at the 4-level or higher is for penalties. With ${p} HCP and no fit for partner, double (trainer guide: about 8+).`, 'F.penalty-double-4')
    : R('P', `RHO jumped to ${plain(ov)}. With only ${p} HCP and no fit, pass (trainer guide: a penalty double here wants about 8+).`, 'GUIDE.penalty-double-4-pass');
}
// Opener when their overcall (suit y) of opener's suit o is passed round (chart H):
// 3+ in their suit pass · a 5-card second suit bid it · 6+ own suit rebid · else double.
function reopen(h, o, y, calls, lead) {
  const l = L(h), cur = lastBid(calls);
  if (l[y] >= 3) return R('P', `${lead}With ${l[y]} ${SN[y]}, partner can't hold a stack and you have nothing to add: pass.`, 'H.reopen');
  const sec = [0, 1, 2, 3].filter(s => s !== o && s !== y && l[s] >= 5).sort((a, b) => l[b] - l[a] || b - a);
  if (sec.length) {
    const s = sec[0], b = B(cheapest(s, cur), s);
    return R(b, `${lead}You have a 5-card second suit: bid it, ${plain(b)}. A double would ask partner to pick an unbid suit, and with a two-suiter it's better to describe your hand.`, 'H.reopen');
  }
  if (l[o] >= 6) { const b = B(cheapest(o, cur), o); return R(b, `${lead}With ${l[o]} ${SN[o]} and nothing else to show, rebid your suit: ${plain(b)}.`, 'H.reopen'); }
  return R('X', `${lead}You are short in ${SN[y]} (${l[y]}) with no natural bid, so reopen with a double. Partner may be sitting over them with a trump stack, and if not, partner can bid an unbid suit.`, 'H.reopen');
}
// Our side once we have doubled or redoubled for penalties (chart F and H): leave partner's
// penalty double in, and double their escape with 4+ cards in it. After our redouble a pass is
// forcing, so the redoubler must double or bid.
function penaltyFollow(seat, calls, h, dealer) {
  if (seat === 'E' || seat === 'W') return AP('');
  const lb = lastBid(calls);
  if (!lb) return AP('');
  const i = calls.lastIndexOf(lb), s = ST.indexOf(lb[1]), us = k => 'NS'.includes(seatAfter(dealer, k));
  if (us(i)) return AP('');
  const after = calls.slice(i + 1);
  if (after.some((v, k) => v === 'X' && us(i + 1 + k))) return R('P', `Partner's double of ${plain(lb)} is for penalties: leave it in.`, 'F.penalty-leave-in');
  const redoubled = calls.some((v, k) => k < i && v === 'XX' && us(k));
  if (redoubled && s < 4) {
    if (h[s].length >= 4) return R('X', `They ran to ${plain(lb)}. After our redouble we want a penalty: double with ${h[s].length} ${SN[s]}.`, 'F.redouble-follow');
    const partnerPassed = after.some((v, k) => v === 'P' && us(i + 1 + k));
    if (!partnerPassed) return R('P', `They ran to ${plain(lb)}. With ${cardsOf(h[s].length, s)} you can't double. After our redouble your pass is forcing: partner must double or bid.`, 'F.redouble-follow');
    const l = L(h), cands = [0, 1, 2, 3].filter(t => t !== s), mx = Math.max(...cands.map(t => l[t]));
    if (mx < 5 && stop(h, s)) {
      const nb = B(cheapest(4, lb), 4);
      return R(nb, `They ran to ${plain(lb)} and partner's pass is forcing (we have the balance of the points). No 5-card suit but a ${SN[s]} stopper: ${plain(nb)}.`, 'F.redouble-follow');
    }
    const top = cands.filter(u => l[u] === mx).sort((a, b) => b - a), pre = `They ran to ${plain(lb)} and partner's pass is forcing: after our redouble we must not let them play undoubled. You can't double with ${cardsOf(h[s].length, s)}, so`;
    if (mx >= 5 && top.length > 1) {
      // 5-5: the higher-ranking suit, unless the lower one is clearly better
      // (two of the top three honours against none).
      const hi = top[0], lo = top[1], honours = u => h[u].filter(r => r >= 12).length;
      if (honours(lo) >= 2 && honours(hi) === 0) {
        const nb = B(cheapest(lo, lb), lo);
        return R(nb, `${pre} with 5-5 bid the better suit: ${plain(nb)}. Your ${SN[lo]} have ${honours(lo)} of the top three honours and your ${SN[hi]} have none, so show the suit you want partner to value and lead.`, 'F.redouble-follow');
      }
      const nb = B(cheapest(hi, lb), hi);
      return R(nb, `${pre} with 5-5 bid the higher-ranking suit: ${plain(nb)}. That leaves room to show ${SN[lo]} next, and partner can choose between them cheaply. (Bid the lower suit first only when it is clearly better: two of the top three honours against none.)`, 'F.redouble-follow');
    }
    const t = top[0], nb = B(cheapest(t, lb), t);
    return R(nb, `${pre} bid your longest suit: ${plain(nb)}.`, 'F.redouble-follow');
  }
  if (calls.some((v, k) => k < i && (v === 'X' || v === 'XX') && us(k)) && s < 4) {
    return h[s].length >= 4 ? R('X', `They ran to ${plain(lb)}. We have already shown we want a penalty, so double their escape with ${h[s].length} ${SN[s]}.`, 'H.double-escape')
      : R('P', `They ran to ${plain(lb)}. With only ${cardsOf(h[s].length, s)}, don't double: pass.`, 'GUIDE.escape-pass');
  }
  return AP('');
}
// Partner doubled their 1NT for penalties (chart H): leave it in unless 0-4 with a 5+ suit.
// If they run: double with 4+ in their suit, weak with a 5+ suit bid it, otherwise pass (forcing).
function ntDblAdvance(h, calls) {
  const p = hcp(h);
  if (calls[2] === 'P') {
    const s = longest(h);
    if (p <= 4 && h[s].length >= 5) return R(B(2, s), `Partner's double is for penalties, but with ${p} HCP and ${h[s].length} ${SN[s]} take out to ${plain(B(2, s))}, to play.`, 'H.nt-double-advance');
    return R('P', `Partner's double is for penalties (16+). ${p <= 4 ? 'Without a 5-card suit' : `With ${p} HCP`}, leave it in.`, 'H.nt-double-advance');
  }
  const y = ST.indexOf(calls[2][1]);
  if (h[y].length >= 4) return R('X', `They ran to ${plain(calls[2])}. With ${h[y].length} ${SN[y]}, double for penalties.`, 'H.nt-double-advance');
  const s = longest(h, [y]), b = B(cheapIn(s, calls), s);
  if (p <= 7 && h[s].length >= 5) return R(b, `They ran to ${plain(calls[2])}. Weak with ${h[s].length} ${SN[s]}: bid ${plain(b)}, to play.`, 'H.nt-double-advance');
  return R('P', `They ran to ${plain(calls[2])}. Not enough ${SN[y]} to double and no long suit: pass. Your pass is forcing, because partner has 16+.`, 'H.nt-double-advance');
}
// The doubler of their 1NT, next time round: after a forcing pass, double with 3+ or bid the longest suit.
function ntDblNext(h, calls) {
  if (calls[2] === 'P') return /^\d/.test(calls[3]) ? R('P', `Partner took out to ${plain(calls[3])}: a weak hand with a long suit. Pass.`, 'H.nt-double-next') : AP('');
  const y = ST.indexOf(calls[2][1]);
  if (calls[3] === 'X') return R('P', `Partner doubled their escape for penalties: leave it in.`, 'H.nt-double-next');
  if (/^\d/.test(calls[3])) return R('P', `Partner bid ${plain(calls[3])}, to play: pass.`, 'H.nt-double-next');
  if (h[y].length >= 3) return R('X', `Partner's pass is forcing. With ${h[y].length} ${SN[y]}, double for penalties.`, 'H.nt-double-next');
  const s = longest(h, [y]), b = B(cheapIn(s, calls), s);
  return R(b, `Partner's pass is forcing. With ${cardsOf(h[y].length, y)}, bid your longest suit: ${plain(b)}.`, 'H.nt-double-next');
}

// ---------- F and H: our 1NT doubled, by the chart or by Helvic Wriggle ----------
// Helvic: pass = 7+ values or a wriggle; XX = weak one-suiter; 2♣/2♦/2♥ = that suit and the next one up.
function helvicType(h) {
  const l = L(h), p = hcp(h);
  if (p >= 7) return 'values';
  const mx = Math.max(...l), pairs = [0, 1, 2].filter(s => l[s] >= 4 && l[s + 1] >= 4);
  if (mx >= 6) return 'one';
  if (pairs.length) return 'two';
  if (l.filter(n => n >= 5).length >= 2) return 'wriggle';
  if (mx >= 5) return 'one';
  return 'wriggle';
}
// Responder's first call after 1NT – (X).
function ntDoubledResp(h, helvic) {
  const l = L(h), p = hcp(h);
  if (!helvic) {
    if (p >= 7) return R('XX', `${p} HCP: redouble (7+). We have the balance of the points.`, 'F.nt-doubled');
    if ([1, 2, 3].some(s => l[s] >= 5)) {
      const c = [1, 2, 3].filter(u => l[u] >= 5), mx = Math.max(...c.map(u => l[u])), ties = c.filter(u => l[u] === mx), s = ties[0];
      if (ties.length > 1) return R(B(2, s), `Weak and 5-5 in ${SN[ties[0]]} and ${SN[ties[1]]}: bid the lower suit, ${plain(B(2, s))}, as a natural sign-off (transfers are off). If they double that too, you can run to 2${SY[ties[1]]} and still be at the 2-level.`, 'F.nt-doubled');
      return R(B(2, s), `Weak with ${l[s]} ${SN[s]}: ${plain(B(2, s))} is a natural sign-off (transfers are off).`, 'F.nt-doubled');
    }
    if (l[0] >= 5) return gap('The chart has no club escape when our 1NT is doubled (2♣ is not on the list).');
    return R('P', `Weak with no 5-card diamond or major suit. The chart has no escape for this hand, so pass and play 1NT doubled. (Helvic Wriggle fixes this.)`, 'GUIDE.nt-doubled-pass');
  }
  const t = helvicType(h);
  if (t === 'values') return R('P', `${p} HCP: pass, planning to pass partner's forced redouble and play 1NT redoubled.`, 'H.helvic');
  if (t === 'one') { const s = longest(h); return R('XX', `Weak one-suiter (${l[s]} ${SN[s]}): redouble. Partner must bid 2♣ and you pass or correct to ${SN[s]}.`, 'H.helvic'); }
  if (t === 'two') { const s = [0, 1, 2].find(u => l[u] >= 4 && l[u + 1] >= 4); return R(B(2, s), `Weak with ${SN[s]} and ${SN[s + 1]} (touching suits): bid ${plain(B(2, s))} to show this suit and the next one up.`, 'H.helvic'); }
  return R('P', `Weak with no 5-card suit and no touching 4-4 (${shapeStr(h)}): pass. Partner must redouble, then you bid your 4-card suits up the line.`, 'H.helvic');
}
// Any later call by our side after 1NT – (X). role 'o' = the 1NT opener, 'r' = responder.
// Opener's calls are at positions 0, 4, 8; responder's at 2, 6, 10.
function ntDoubledCall(role, h, calls, helvic) {
  const n = calls.length, l = L(h), k = role === 'o' ? (n - 4) / 4 : (n - 2) / 4;
  const o = [calls[0], calls[4], calls[8]], r = [calls[2], calls[6], calls[10]];
  if (role === 'r' && k === 0) return ntDoubledResp(h, helvic);
  if (!helvic) {
    if (role === 'o' && k === 0) {
      if (r[0] === 'XX') return R('P', 'Partner redoubled with 7+: pass and play 1NT redoubled.', 'F.nt-doubled-opener');
      if (/^\d/.test(r[0])) return R('P', `Partner's ${plain(r[0])} is a sign-off: pass.`, 'F.nt-doubled-opener');
    }
    return AP('');
  }
  if (role === 'o' && k === 0) {
    if (r[0] === 'P') return R('XX', "Partner's pass is a Helvic wriggle or a values pass: you must redouble.", 'H.helvic-opener');
    if (r[0] === 'XX') return R('2C', "Partner's redouble shows a weak one-suiter: bid 2♣. Partner will pass or correct.", 'H.helvic-opener');
    const z = ST.indexOf(r[0][1]);
    if (l[z] >= 3) return R('P', `Partner shows ${SN[z]} and ${SN[z + 1]}. With ${l[z]} ${SN[z]}, pass.`, 'H.helvic-opener');
    return R(B(2, z + 1), `Partner shows ${SN[z]} and ${SN[z + 1]}. With only ${l[z]} ${SN[z]}, bid ${plain(B(2, z + 1))}.`, 'H.helvic-opener');
  }
  if (role === 'r' && k === 1) {
    if (r[0] === 'P' && o[1] === 'XX') {
      if (hcp(h) >= 7) return R('P', `You passed with values (${hcp(h)} HCP): pass again and play 1NT redoubled.`, 'H.helvic');
      const z = [0, 1, 2, 3].find(s => l[s] >= 4);
      return R(B(2, z), `Partner redoubled as asked. Bid your lowest 4-card suit: ${plain(B(2, z))}.`, 'H.helvic');
    }
    if (r[0] === 'XX' && o[1] === '2C') { const s = longest(h); return s === 0 ? R('P', 'Your one-suiter is clubs: pass 2♣.', 'H.helvic') : R(B(2, s), `Correct to your suit: ${plain(B(2, s))}.`, 'H.helvic'); }
    return AP('');
  }
  if (role === 'o' && k === 1) {
    if (r[0] === 'P' && /^2/.test(r[1] || '')) {
      const z = ST.indexOf(r[1][1]);
      if (l[z] >= 3) return R('P', `Partner bid ${plain(r[1])} as the lowest of up to two 4-card suits. With ${l[z]} ${SN[z]}, pass.`, 'H.helvic-opener');
      if (z === 3) return gap('Opener is short in spades, the highest suit: Helvic has no next suit up.');
      return R(B(2, z + 1), `Only ${l[z]} ${SN[z]}: bid the next suit up, ${plain(B(2, z + 1))}. Partner passes or shows another suit.`, 'H.helvic-opener');
    }
    return AP('');
  }
  if (role === 'r' && k === 2) {
    if (r[0] === 'P' && /^2/.test(o[2] || '')) {
      const z = ST.indexOf(r[1][1]), zz = ST.indexOf(o[2][1]), nx = [0, 1, 2, 3].find(s => s > z && l[s] >= 4);
      if (nx === undefined) return R('P', `No second 4-card suit, and partner has 3+ ${SN[zz]} (the short suit was ${SN[z]}): pass.`, 'H.helvic');
      if (nx === zz) return R('P', `You have four ${SN[zz]} too: pass.`, 'H.helvic');
      if (nx < zz) return gap('Your other 4-card suit is below the one partner chose.');
      return R(B(2, nx), `Show your other 4-card suit: ${plain(B(2, nx))}.`, 'H.helvic');
    }
    return AP('');
  }
  if (role === 'o' && k === 2 && /^2/.test(r[2] || '')) return R('P', 'Partner showed a second suit; you have at least three there (your only short suit was the first one). Pass.', 'H.helvic-opener');
  return AP('');
}

// ---------- H: unassuming cue bid (partner overcalls) ----------
// Cue bid of opener's suit = 3+ support, 10+ · simple raise 3+, 6-9 · jump raise 4+, 4-8 (pre-emptive).
function ucbAdvance(h, x, ov) {
  const y = ST.indexOf(ov[1]), lv = +ov[0], t = h[y].length, p = hcp(h);
  if (t < 3) return gap('Without three-card support, the unassuming cue bid section has no call.');
  if (p >= 10) { const cue = B(cheapest(x, ov), x); return R(cue, `Partner overcalled ${plain(ov)} and you have ${t}-card support with ${p} HCP (10+): cue-bid opener's suit, ${plain(cue)}. That's the unassuming cue bid: a limit raise or better. It says nothing about ${SN[x]}.`, 'H.ucb'); }
  if (t >= 4 && p >= 4 && p <= 8) return R(B(lv + 2, y), `${t}-card support and only ${p} HCP: jump raise to ${plain(B(lv + 2, y))}. It's pre-emptive, not a limit raise; that's what the cue bid is for.`, 'H.ucb-jump-raise');
  if (p >= 6) return R(B(lv + 1, y), `${t}-card support and ${p} HCP (6-9): simple raise to ${plain(B(lv + 1, y))}.`, 'H.ucb-raise');
  return R('P', `Only ${p} HCP: pass partner's overcall.`, 'H.ucb-raise');
}
// Overcaller after the cue bid: cheapest rebid = minimum (8-12), jump to game = 13+.
function ucbOvercaller(h, ov, cue) {
  const y = ST.indexOf(ov[1]), p = hcp(h);
  if (p >= 13) return R(B(4, y), `Partner's ${plain(cue)} shows support and 10+. With ${p} HCP (13+), jump to game: ${plain(B(4, y))}.`, 'H.ucb-rebid');
  const b = B(cheapest(y, cue), y);
  return R(b, `Partner's ${plain(cue)} shows support and 10+. With a minimum overcall (${p} HCP), bid ${plain(b)}: the cheapest rebid of your suit says "minimum".`, 'H.ucb-rebid');
}
// Advancer after the overcaller's minimum rebid: game with 13+.
function ucbAfterMin(h, y, reb) {
  const p = hcp(h);
  return p >= 13 ? R(B(4, y), `Partner rebid ${plain(reb)}: a minimum overcall. With ${p} HCP you still want game: ${plain(B(4, y))}.`, 'H.ucb-after-minimum')
    : R('P', `Partner rebid ${plain(reb)}: a minimum overcall. With ${p} HCP (10-12) there's no game: pass.`, 'H.ucb-after-minimum');
}

// ---------- H: support doubles ----------
// 1♣/♦/♥ – 1♥/♠ – (overcall up to 2 of responder's suit) – X = exactly 3-card support;
// after their double, XX = exactly 3. With 4+, raise (11-14 simple, 15-19 double raise).
function supCall(h, M, calls, opp) {
  const t = L(h)[M], p = hcp(h), dbl = opp === 'X', name = dbl ? 'support redouble' : 'support double';
  const what = dbl ? 'RHO doubled' : `RHO overcalled ${plain(opp)}`;
  if (t === 3) return R(dbl ? 'XX' : 'X', `${what}. With exactly 3 ${SN[M]}, ${dbl ? 'redouble' : 'double'}: a ${name} shows exactly 3-card support for partner's ${SN[M]}.`, 'H.support-double');
  if (t >= 4) {
    const b = B(Math.max(p >= 15 ? 3 : 2, cheapest(M, lastBid(calls))), M);
    return R(b, `${what}. With ${t} ${SN[M]} you raise directly; the ${name} would show only three. ${p >= 15 ? `${p} HCP (15-19): double raise to ${plain(b)}.` : `${p} HCP (11-14): simple raise to ${plain(b)}.`}`, 'H.support-raise');
  }
  return R('P', `${what}. With only ${t} ${SN[M]} you can't ${dbl ? 'redouble' : 'double'} (that would promise three), and you have nothing natural to show: pass.`, 'H.support-double');
}
// Responder after the support double: 0-9 cheapest bid in the major · 10-12 invite (3M, or 2NT
// with 4 cards and a stopper) · 13+ game (4M, or 3NT with 4 cards and a stopper).
function supResp(h, M, calls, opp, sup) {
  const t = L(h)[M], p = hcp(h), y = /^\d/.test(opp) ? ST.indexOf(opp[1]) : -1, stp = y >= 0 && y < 4 && stop(h, y);
  const c2 = cheapest(M, lastBid(calls)), fit = `Partner's ${plain(sup)} shows exactly 3 ${SN[M]}, so you have ${t + 3} between you.`;
  if (p >= 13) {
    if (t === 4 && stp) return R('3N', `${fit} With ${p} HCP you want game; with only a 7-card fit and a ${SN[y]} stopper, 3NT.`, 'H.support-response');
    return R(B(4, M), `${fit} With ${p} HCP (13+), bid game: ${plain(B(4, M))}.`, 'H.support-response');
  }
  if (p >= 10) {
    if (t === 4 && stp && bv('2N') > bv(lastBid(calls))) return R('2N', `${fit} ${p} HCP (10-12) is invitational; with a 7-card fit and a ${SN[y]} stopper, invite with 2NT.`, 'H.support-response');
    return R(B(c2 + 1, M), `${fit} ${p} HCP (10-12): invite with a jump to ${plain(B(c2 + 1, M))}.`, 'H.support-response');
  }
  return R(B(c2, M), `${fit} With ${p} HCP (0-9), just bid ${plain(B(c2, M))}.`, 'H.support-response');
}
// Opener after responder's invitation: accept with 13+.
function supAfterInvite(h, M, inv) {
  const p = hcp(h);
  if (p >= 13) return inv === '2N' ? R('3N', `Partner invites with 2NT (10-12). With ${p} HCP (13+), accept: 3NT.`, 'H.support-invite-answer') : R(B(4, M), `Partner invites with ${plain(inv)} (10-12). With ${p} HCP (13+), accept: ${plain(B(4, M))}.`, 'H.support-invite-answer');
  return R('P', `Partner invites (10-12). With ${p} HCP (11-12), decline: pass.`, 'H.support-invite-answer');
}
// Responder after opener's direct raise (4+ support).
function supAfterRaise(h, M, raise) {
  const p = hcp(h);
  if (+raise[0] >= 3) return p >= 10 ? R(B(4, M), `Opener's double raise shows 15-19. With ${p} (10+), bid game.`, 'D.after-double-raise') : R('P', `Opener's double raise shows 15-19. With ${p} (6-9), pass.`, 'D.after-double-raise');
  if (p >= 13) return R(B(4, M), `Opener's simple raise shows 11-14. With ${p} (13+), bid game.`, 'D.after-raise');
  if (p >= 11) return R(B(3, M), `Opener's simple raise shows 11-14. With ${p} (11-12), invite with 3${SY[M]}.`, 'D.after-raise');
  return R('P', `Opener's simple raise shows 11-14. With ${p} (10 or less), pass.`, 'D.after-raise');
}
