// Engine tests: card helpers, worked chart examples, regressions, and invariants over every drill.
// Hands are written spades.hearts.diamonds.clubs (see parseHand in harness.js).
'use strict';

// ---------- Card helpers ----------
test('hcp counts A=4 K=3 Q=2 J=1', () => same(hcp(parseHand('AKQJ.432.432.432')), 10));
test('isBal accepts 4333, 4432, 5332 only', () => {
  check(isBal(parseHand('A432.K32.Q32.J32')));
  check(isBal(parseHand('A432.K432.Q2.J32')));
  check(isBal(parseHand('A5432.K32.Q2.J32')));
  check(!isBal(parseHand('A5432.K432.Q2.J2')));
  check(!isBal(parseHand('A432.K432.Q432.2')));
});
test('bv orders every bid 1C..7NT', () => {
  const all = [];
  for (let l = 1; l <= 7; l++) for (const s of ST) all.push(l + s);
  all.forEach((b, i) => same(bv(b), i, b));
});
test('cheapest level for a strain', () => {
  same(cheapest(3, '1H'), 1);   // 1♠ over 1♥
  same(cheapest(0, '1H'), 2);   // 2♣ over 1♥
  same(cheapest(4, '1S'), 1);   // 1NT over 1♠
});
test('plain() spells calls', () => same(['P', 'X', 'XX', '1N', '3H'].map(plain), ['Pass', 'X', 'XX', '1NT', '3♥']));
test('deal() honours lengths and HCP range', () => {
  const rng = mulberry(7);
  for (let i = 0; i < 200; i++) {
    const h = deal(rng, [3, 3, 4, 3], 15, 17);
    same(L(h), [3, 3, 4, 3]);
    check(hcp(h) >= 15 && hcp(h) <= 17, 'hcp ' + hcp(h));
  }
});
test('dealOther() never reuses a card', () => {
  const rng = mulberry(8);
  for (let i = 0; i < 200; i++) {
    const a = deal(rng, [4, 3, 3, 3], 0, 40), b = dealOther(rng, a, sp({}, [0, 6]), 0, 40);
    for (let s = 0; s < 4; s++) for (const r of a[s]) check(!b[s].includes(r), 'shared card');
  }
});

// ---------- Opening bids ----------
const opening = str => { const c = openingBid(parseHand(str)); return isCall(c) ? c.bid : null; };
test('opening: 15-17 balanced opens 1NT', () => same(opening('AK2.QJ3.K842.Q73'), '1N'));
test('opening: 12-14 balanced opens the longer minor', () => {
  same(opening('K32.Q32.AJ42.K32'), '1D');
  same(opening('K32.Q32.AJ4.K432'), '1C');
});
test('opening: 18-19 balanced opens a minor', () => same(opening('AK2.KQ3.A842.Q73'), '1D'));
test('opening: 20-22 balanced opens 2NT', () => same(opening('AK2.KQ3.AK42.Q73'), '2N'));
test('opening: 23+ opens 2♣', () => same(opening('AKQ2.AKQ.KQ2.J32'), '2C'));
test('opening: 5-5 opens the higher-ranking suit (chart, Oct 2026)', () => {
  same(opening('AQ432.KQ432.2.32'), '1S');
  same(opening('32.2.AQ432.KQ432'), '1D');
});
test('opening: a longer minor (6-5) opens the minor; equal length opens the major', () => {
  same(opening('A.AQ432.2.KJ5432'), '1C');
  same(opening('98543.A.AKQJ73.Q'), '1D');
  same(opening('A2.AQ432.2.KJ543'), '1H');
});
test('opening: 5332 with a 5-card major and 15-17 is not dealt', () => same(opening('K32.AQJ32.K4.Q32'), null));
test('opening: weak two, but no weak 2♣', () => {
  same(opening('KQJ932.32.432.32'), '2S');
  same(opening('32.432.32.KQJ932'), 'P');
});
test('opening: seven-card pre-empt', () => same(opening('KQJ9432.32.32.32'), '3S'));
test('opening: 5-4 with 8 HCP passes, and says why', () => {
  const c = openingBid(parseHand('KQ432.K432.32.32'));
  same(c.bid, 'P');
  check(/no 6-card suit/.test(c.why), c.why);
});

// ---------- A: 1NT ----------
test('1NT: transfers, Texas, Stayman', () => {
  same(callFor('1N', '32.Q8765.432.J32'), '2D');
  same(callFor('1N', 'KQJ432.A2.32.Q32'), '4H');
  same(callFor('1N', 'AQ432.K432.32.32'), '2C');
  same(callFor('1N', 'KQ32.432.K32.J32'), '2C');
});
test('1NT: no major — 8 range-ask, 9 invite, 10 game, weak pass', () => {
  same(callFor('1N', 'K32.Q32.Q432.J32'), '2S');
  same(callFor('1N', 'K32.Q32.K432.J32'), '2N');
  same(callFor('1N', 'K32.K32.K432.J32'), '3N');
  same(callFor('1N', '432.432.Q432.J32'), 'P');
});
test('1NT: opener completes transfers and answers Stayman', () => {
  same(callFor('1N 2D', 'AK2.QJ3.K842.Q73'), '2H');
  same(callFor('1N 2H', 'AK2.QJ3.K842.Q73'), '2S');
  same(callFor('1N 2C', 'AQ32.KJ32.K32.Q2'), '2H');
});
test('1NT: Smolen and the answer to it', () => {
  same(callFor('1N 2C 2D', 'AQ432.KQ32.32.32'), '3H');
  same(callFor('1N 2C 2D 3H', 'K32.AQ2.KQ32.Q32'), '4S');
});
test('1NT: opener answers the range-ask', () => same(callFor('1N 2S', 'AK2.QJ3.K842.Q73'), '2N'));
test('regression: 8 HCP with a six-card minor uses the range-ask, not the weak sign-off', () => {
  const h = 'JT.T76.KJ9654.QJ';   // 8 HCP
  same(callFor('1N', h), '2S');
  same(callFor('1N 2S 3C', h), '3N', 'opposite 17');
  same(callFor('1N 2S 2N', h), 'P', 'opposite 15-16');
});
test('1NT: a weak hand with a long minor signs off', () => {
  const h = 'JT.T76.KJ9654.Q2';   // 7 HCP
  same(callFor('1N', h), '2S');
  same(callFor('1N 2S 2N', h), '3D');
  same(callFor('1N 2S 3C', h), '3D');
});

// ---------- B: 1♥/1♠ ----------
test('1♥: raises by support and strength', () => {
  same(callFor('1H', 'K32.Q32.J432.Q32'), '2H');    // 3 trumps, 8
  same(callFor('1H', 'K32.Q432.J32.Q32'), '3D');    // 4 trumps, 8
  same(callFor('1H', 'A32.KQ32.K32.Q32'), '2N');    // 4 trumps, 14: Jacoby
  same(callFor('1H', '32.Q8432.J32.Q32'), '4H');    // 5 trumps, 5: weak raise
  same(callFor('1H', 'KJ32.32.Q432.J32'), '1S');
});
test('Jacoby: opener shows shortness or strength', () => {
  same(callFor('1H 2N', 'A.KQJ32.K432.432'), '3S');
  same(callFor('1H 2N', 'AQ2.KQJ32.K32.32'), '3N');
});

// ---------- G: RKCB ----------
const rk = str => { const c = rkReply(parseHand(str), 2); return isCall(c) ? c.bid : null; };
test('RKCB replies (hearts trumps)', () => {
  same(rk('A32.K432.A32.432'), '5C');   // 3
  same(rk('A32.KQ32.432.432'), '5S');   // 2 with the queen
});
test('regression: all five key cards has no chart reply', () => same(rk('A2.AK32.A32.A432'), null));
test('RKCB: the asker decides', () => {
  same(askDecide(parseHand('A32.K432.A32.432'), 2, '5D').bid, '6H');   // 3 + 1 = 4 of 5
  same(askDecide(parseHand('A32.K432.A32.432'), 2, '5C').bid, '5H');   // 3 + 0: missing two
});

test('RKCB: an unclear reply is worked out from the points, not read low', () => {
  // You hold 2 (10 HCP), so partner has 21+ and the opponents at most 9: too few for three key
  // cards (11+). 5♣ must be 3: all five with the queen, so ask for kings.
  same(askDecide(parseHand('A32.QJ32.A32.432'), 2, '5C').bid, '5N');
  same(askDecide(parseHand('A32.QJ32.A32.432'), 2, '5C', true).bid, '5N');
  // 1 or 4 with 2 of your own: 4 would make six, so it's 1.
  same(askDecide(parseHand('A32.KJ32.A32.432'), 2, '5D').bid, '6H');
});
test('RKCB: kings and the grand slam need the trump queen', () => {
  same(askDecide(parseHand('A2.AJ32.A32.A432'), 2, '5D').bid, '6H');         // 4 + 1 = 5 but no ♥Q
  same(kingReply(parseHand('K32.Q432.K32.432'), 2).bid, '6D');               // cheapest side king
  same(kingReply(parseHand('432.Q432.432.432'), 2).bid, '6H');               // none
  same(grandDecide(parseHand('A2.AQ32.A32.A432'), 2, '6S').bid, '7H');
  same(grandDecide(parseHand('A2.AQ32.A32.A432'), 2, '6H').bid, 'P');
});
test('slam: Jacoby opener with 18+ and 2+ key cards bids 4NT at once', () => {
  same(callFor('1H 2N', 'AK2.AKJ32.K32.32'), '4N');
  same(callFor('1H 2N', 'KQ2.KQJ32.KQ2.Q2'), '3H');   // 18 but one key card: 3♥ (flat 18+)
});
test('slam: 31+ asks with 2+ key cards, otherwise bids game', () => {
  same(callFor('1H 2N 3H', 'A432.K432.AQ2.32'), '4N');
  same(callFor('1H 2N 3H', 'KQ32.Q432.KQ2.Q2'), '4H');
});
test('LTC: opener with 13-14 after a limit raise counts losers (chart B)', () => {
  same(losers(parseHand('A2.KQJ32.K432.32')), 6);
  same(callFor('1H 3H', 'A2.KQJ32.K432.32'), '4H');   // 6 losers: 24 - 14 = 10 tricks
  same(callFor('1H 3H', 'QJ.KQ432.K432.Q2'), 'P');    // 7 losers: 9 tricks
});
test('2NT: after a transfer, 4-5 points with exactly five offers 3NT (chart E)', () => {
  same(callFor('2N 3D 3H', 'Q32.K8765.432.32'), '3N');
  same(callFor('2N 3D 3H 3N', 'AK2.KQ3.AK42.Q73'), '4H');
  same(callFor('2N 3D 3H 3N', 'AK32.KQ.AK42.Q73'), 'P');
});
test('chart C: over 1♣, four diamonds and a 4-card major bids the major', () => same(callFor('1C', 'J32.KJ32.Q432.32'), '1H'));
test('chart D: responder with 10 or less passes or gives preference', () => {
  same(callFor('1H 1S 2C', 'KJ32.Q32.5432.32'), '2H');
  same(callFor('1H 1S 2C', 'KJ32.32.432.5432'), 'P');
  same(callFor('1H 1S 3H', 'KJ32.32.Q432.J32'), 'P');    // jump rebid, 6-9: sign off
  same(callFor('1H 1S 3H', 'KQ32.32.KQ32.432'), '4H');   // 10+: game
});
test('trainer guides where the chart stops', () => {
  same(callFor('1C 1H 1N 2N', 'K32.Q32.K32.AJ32'), '3N');   // 13: accept the invitation
  same(callFor('3S', 'K32.Q32.J432.432'), 'P');              // pre-empt: pass
  same(callFor('3S', 'A32.K32.A432.432'), '4S');             // 3 aces and kings: game
  same(callFor('2C 2D 2H', '432.432.5432.432'), '4H');
  same(callFor('2H 2N 3H', 'AK32.32.AQ32.K32'), 'P');
});


// ---------- F: competitive ----------
test('competitive: overcalls and doubles', () => {
  same(overcall(parseHand('KQ2.A32.KJ32.Q32'), 3).bid, '1N');
  same(overcall(parseHand('AQ32.2.KJ32.Q432'), 2).bid, 'X');
  same(negDbl(parseHand('KJ32.Q432.32.432'), 0, 1).bid, 'X');
  same(vs1NT(parseHand('AQ432.KJ32.32.32')).bid, '2D');
  same(advance(parseHand('432.Q8432.J32.32'), 0).bid, '1H');
});

test('advancing a takeout double: a 4-card major first; 12+ cue-bids (chart F)', () => {
  same(advance(parseHand('Q432.32.KJ432.32'), 0).bid, '1S');
  same(advance(parseHand('AQ32.K32.KJ32.32'), 0).bid, '2C');
});

// ---------- Whole auctions ----------
test('simulate: 1NT – 2♦ – 2♥ – pass', () => {
  const sim = simulate(parseHand('43.98765.Q53.J52'), parseHand('AK2.QJ3.K842.Q73'), 'N', 'note');
  same(sim.calls, ['1N', 'P', '2D', 'P', '2H', 'P', 'P', 'P']);
  same(sim.contract, '2H');
  same(sim.steps.map(s => s.ans.bid), ['2D', 'P']);
});
test('regression: after South passes, a partner with an opening is not shown as passing', () => {
  // Reported deal: partner has 12 HCP 6-6 and would open 1♠.
  const q = { partner: true, ...simulate(parseHand('J9852.54.A72.K92'), parseHand('AKQ643.-.K98543.5'), 'S', 'note') };
  same(q.calls, ['P', 'P']);
  same(q.contract, null);
  check(!/passed out/.test(outcome(q)), outcome(q));
});
test('a deal where both partners pass is passed out with four passes', () => {
  const sim = simulate(parseHand('J9852.54.A72.K92'), parseHand('Q743.J962.KQ3.J8'), 'S', 'note');
  same(sim.calls, ['P', 'P', 'P', 'P']);
  same(sim.contract, null);
  same(sim.pn.map(x => x.call), ['P']);
  same(outcome({ partner: true, ...sim }), 'Nobody opens: the hand is passed out.');
});
test('legal(): minimum bid and when X / XX are allowed', () => {
  same(legal('N', ['1H', '1S']), { min: bv('1S'), x: true, xx: false });
  same(legal('W', ['1C', 'X', 'P']), { min: bv('1C'), x: false, xx: false });
  same(legal('E', ['1N']), { min: bv('1N'), x: true, xx: false });
  same(legal('S', []), { min: -1, x: false, xx: false });
});
test('the auction ends after three passes, and records its contract', () => {
  const sim = simulate(parseHand('K32.Q32.K432.J32'), parseHand('AQ4.KJ4.A65.Q654'), 'N', 'note');
  same(sim.calls, ['1N', 'P', '2N', 'P', '3N', 'P', 'P', 'P']);
  same(sim.contract, '3N');
  same(sim.steps.map(s => s.ans.bid), ['2N'], 'your pass after 3NT is automatic');
  same(sim.stop, null);
});
test('obvious passes after game are automatic, so these auctions reach a contract', () => {
  same(callFor('1H 1S 2S 4S', 'K2.AQJ32.K32.432'), 'P');
  same(callFor('1N 2N 3N', 'K32.Q32.K432.J32'), 'P');
  same(callFor('1N 4N 6N', 'K32.Q32.K432.J32'), 'P');
  same(callFor('2C 2D 3N', '432.432.5432.432'), 'P');
});
test('when the chart stops, the auction says why', () => {
  // Partner opens 2♣ and you hold 13+: the chart has no response.
  const q = { partner: true, ...simulate(parseHand('K32.QJ2.QJ2.A432'), parseHand('AQ4.AK43.AK3.KQ5'), 'N', 'note') };
  same(q.calls, ['2C', 'P']);
  same(q.contract, null);
  same([q.stop.stop, q.stop.seat], ['gap', 'S']);
  check(/13\+/.test(outcome(q)), outcome(q));
  // "More than one call" and "no call" are told apart.
  same(r1NT(parseHand('AQ432.KJ432.32.2')).stop, 'ambiguous');   // 5-5 majors: transfer to either
  same(rkReply(parseHand('A2.AK32.A32.A432'), 2).stop, 'gap');    // five key cards: no reply
});
test('regression: "new suit first, then support" keeps its promise', () => {
  const h = 'AQ52.J63.K54.A92';   // 14 HCP, three hearts, four spades
  same(callFor('1H', h), '1S');
  same(callFor('1H 1S 1N', h), '4H', 'opposite a minimum 1NT: support hearts, not 3NT');
  same(callFor('1H 1S 2C', h), '4H');
  same(callFor('1H 1S 2S', h), '4S', 'opener raised spades: the 4-4 fit will do');
  same(callFor('1H 1S 3H', h), '4H', 'opener jumped in hearts: 14 + 15 is short of slam, so game');
  same(callFor('1H 1S 2N', h), '4N', 'opener has 18-19: 14 + 18 = 32 with a fit, so ask for key cards');
  same(callFor('1H 1S 1N', 'AQ52.Q63.KQ4.A92'), '4H', '17 opposite 11-14 is under 31: game');
});
test('regression: opposite an 18-19 2NT rebid, 7 HCP bids game after a 1NT response too', () => {
  same(callFor('1C 1N 2N', 'Q75.Q63.K842.982'), '3N');   // 7 HCP
  same(callFor('1C 1N 2N', 'Q75.J63.K842.982'), 'P');    // 6 HCP
});

// ---------- The four-seat auction ----------
test('auctionState: whose turn, our calls and theirs', () => {
  const st = auctionState('W', ['P', '1N', '2C']);   // W passes, N opens 1NT, E overcalls: South to call
  same([st.seat, st.partner, st.lho, st.rho], ['S', 'N', 'W', 'E']);
  same(st.ours, ['1N']);
  same(st.theirs, ['P', '2C']);
  same(st.contested, true);
  same(auctionState('N', ['1N', 'P']).contested, false);
});
test('contested auctions go to chart F: overcalls, negative doubles, advances, Cappelletti', () => {
  const h = parseHand('AQ32.2.KJ32.Q432');
  same(chartCall(auctionState('E', ['1H']), h).bid, overcall(h, 2).bid);
  same(chartCall(auctionState('N', ['1C', '1D']), parseHand('KJ32.Q432.432.54')).id, 'F.negative-double');
  const a = parseHand('432.Q8432.J32.32');
  same(chartCall(auctionState('W', ['1C', 'X', 'P']), a).bid, advance(a, 0).bid);
  same(chartCall(auctionState('E', ['1N']), parseHand('AQ432.KJ32.32.32')).id, 'F.cappelletti-2d');
  // After your own call, the chart has nothing more in a contested auction.
  same(chartCall(auctionState('E', ['1H', 'X', '2H', 'P', 'P']), h).stop, 'gap');
});
test('simulate: an opponent who overcalls', () => {
  // North opens 1♣, East overcalls 1♦: South has both majors and makes a negative double.
  const sim = simulate(parseHand('KJ32.Q432.432.54'), parseHand('A54.K65.Q76.AJ32'), 'N', 'note', st => st.calls.length === 1 ? '1D' : 'P');
  same(sim.calls, ['1C', '1D', 'X', 'P']);
  same(sim.steps.map(s => s.ans.id), ['F.negative-double']);
  same([sim.stop.stop, sim.stop.seat], ['gap', 'N']);
});

// ---------- Rule ids ----------
const RULE_ID = /^(OB|[A-H]|LTC|GUIDE)\.[a-z0-9]+(-[a-z0-9]+)*$/;
// Every rule id written in the code, found by reading the source of each global function.
function allRuleIds() {
  const ids = new Set();
  for (const k of Object.getOwnPropertyNames(window)) {
    let f;
    try { f = window[k]; } catch (e) { continue; }
    if (typeof f === 'function') for (const m of String(f).matchAll(/'((?:OB|LTC|GUIDE|[A-H])\.[^']*)'/g)) ids.add(m[1]);
  }
  return ids;
}
test('rule ids: every chart answer has a well-formed id that starts with its chart letter', () => {
  const ids = allRuleIds();
  check(ids.size > 100, `found only ${ids.size} rule ids`);
  for (const id of ids) check(RULE_ID.test(id), `badly formed rule id "${id}"`);
  same(R('2C', 'why', 'A.stayman'), { bid: '2C', why: 'why', id: 'A.stayman', ref: 'A' });
});

// ---------- Invariants over every drill set ----------
// Every "N HCP" in an explanation about your own hand must be your actual HCP.
const HCP_CLAIM = /(?<![-\d]|under )(\d+) HCP/g;
const ASKED = new Set();   // rule ids asked of South in some drill
function checkWhy(why, h, where) {
  check(!/undefined|NaN|null|\[object/.test(why), `${where}: bad text "${why}"`);
  for (const m of why.matchAll(HCP_CLAIM)) check(+m[1] === hcp(h), `${where}: says ${m[1]} HCP, hand has ${hcp(h)}: "${why}"`);
}
// Is calls[i] legal for the seat that makes it? (Bids must outrank the last bid; X only of an
// opponent's bid; XX only of an opponent's double.)
function legalFor(dealer, calls, i) {
  const seats = ['W', 'N', 'E', 'S'], seatOf = k => seats[(seats.indexOf(dealer) + k) % 4];
  const side = s => 'NS'.includes(s) ? 'NS' : 'EW';
  let last = null, lastSeat = null, lb = null;
  for (let k = 0; k < i; k++) {
    if (calls[k] !== 'P') { last = calls[k]; lastSeat = seatOf(k); }
    if (/^\d/.test(calls[k])) lb = calls[k];
  }
  const c = calls[i], opp = lastSeat && side(lastSeat) !== side(seatOf(i));
  if (/^\d/.test(c)) return !lb || bv(c) > bv(lb);
  if (c === 'X') return !!last && /^\d/.test(last) && opp;
  if (c === 'XX') return last === 'X' && opp;
  return c === 'P';
}
function checkQuestion(q, where) {
  const hands = [q.hand, q.partner].filter(Boolean);
  for (const h of hands) {
    same(h.flat().length, 13, where + ' cards');
    h.forEach(s => check(new Set(s).size === s.length, where + ' duplicate card'));
  }
  if (q.partner) for (let s = 0; s < 4; s++) for (const r of q.hand[s]) check(!q.partner[s].includes(r), where + ' shared card');
  // The auction is legal call by call, for whichever seat makes each call.
  q.calls.forEach((c, i) => {
    check(/^([1-7][CDHSN]|P|X|XX)$/.test(c), `${where}: bad call ${c}`);
    check(legalFor(q.dealer, q.calls, i), `${where}: illegal ${c} (call ${i}) in ${q.calls.join(' ')}`);
  });
  check(q.steps.length > 0, where + ' no steps');
  q.steps.forEach((st, k) => {
    check(st.note, `${where} step ${k}: no note`);
    if (st.kind === 'num') {   // an LTC counting step, answered on the number pad
      check(st.opts.includes(st.ans.bid), `${where} step ${k}: answer ${st.ans.bid} is not on the number pad`);
      return;
    }
    const lg = legal(q.dealer, st.calls), b = st.ans.bid;
    check(!/^\d/.test(b) || bv(b) > lg.min, `${where} step ${k}: answer ${b} is insufficient`);
    check(b !== 'X' || lg.x, `${where} step ${k}: answer X is not allowed`);
    check(Object.keys(REF).includes(st.ans.ref), `${where} step ${k}: chart ref "${st.ans.ref}"`);
    check(RULE_ID.test(st.ans.id) && st.ans.id.split('.')[0] === st.ans.ref, `${where} step ${k}: rule id "${st.ans.id}"`);
    checkWhy(st.ans.why, q.hand, `${where} step ${k}`);
  });
  if (q.partner) q.pn.filter(x => !x.auto).forEach((x, k) => checkWhy(x.why, q.partner, `${where} partner call ${k}`));
  check(q.contract === null || /^[1-7][CDHSN]$/.test(q.contract), where + ' contract');
  // A whole-auction drill ends exactly one way: a contract after three passes, passed out,
  // or stopped by the chart with a reason.
  if (q.partner) {
    const passedOut = q.calls.length === 4 && q.calls.every(c => c === 'P');
    same([!!q.contract, passedOut, !!q.stop].filter(Boolean).length, 1, `${where}: how the auction ends (${q.calls.join(' ')})`);
    if (q.contract) same(q.calls.slice(-3), ['P', 'P', 'P'], where + ' ends with three passes');
    if (q.stop) check(/^(ambiguous|gap)$/.test(q.stop.stop) && q.stop.why && /^[NS]$/.test(q.stop.seat), `${where}: stop ${JSON.stringify(q.stop)}`);
  }
  // A deal with no bid at all must really be passed out: four passes, partner has no opening.
  if (q.partner && !q.calls.some(c => /^\d/.test(c))) {
    same(q.calls, ['P', 'P', 'P', 'P'], where + ' passed-out auction');
    same(openingBid(q.partner).bid, 'P', where + ' partner of a passed hand');
  }
}
const SEEDS = 8;
for (const d of SETS) for (const helvic of d.helvic ? [false, true] : [false]) {
  const name = d.id + (helvic ? ' (Helvic)' : '');
  test(`set "${name}": ${setSize(d)} good hands for seeds 1-${SEEDS}, built quickly`, () => {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const t0 = performance.now(), qs = buildSet(d, seed, { helvic }), ms = performance.now() - t0;
      same(qs.length, setSize(d), `seed ${seed} size`);
      check(ms < 1000, `seed ${seed} took ${ms.toFixed(0)} ms`);
      const keys = new Set(qs.map(q => JSON.stringify(q.hand)));
      check(keys.size === qs.length || d.id === 'comp' || d.id === 'mixed', `seed ${seed}: repeated hand`);
      if (!d.slam) qs.forEach((q, i) => check(!slamHand(q), `${name}#${seed}/${i}: a slam hand in a non-slam drill`));
      qs.forEach((q, i) => checkQuestion(q, `${name}#${seed}/${i}`));
      qs.forEach(q => q.steps.forEach(st => { if (st.kind !== 'num') ASKED.add(st.ans.id); }));
    }
  });
}
// Every rule on the chart must be practised: each one is asked of you in some drill within
// the first few deals. The only exceptions are calls that are always partner's in the drills
// (you see them in the whole hand at the end).
const PARTNER_ONLY = new Set(['GUIDE.redouble-raise']);
test('rule coverage: every chart rule is asked of you in some drill (seeds 1-8)', () => {
  const all = allRuleIds(), never = [...all].filter(id => !ASKED.has(id) && !PARTNER_ONLY.has(id)).sort();
  info('rule coverage', `${all.size - never.length - PARTNER_ONLY.size} of ${all.size - PARTNER_ONLY.size} chart rules are asked of you.`);
  same(never, [], 'never asked');
});
test('no drill auction stops early: every hand reaches a contract (seeds 1-4)', () => {
  const stops = [];
  for (const d of SETS) for (let s = 1; s <= 4; s++) buildSet(d, s, {}).forEach(q => { if (q.stop) stops.push(`${d.id}#${s}: ${q.calls.join(' ')}: ${q.stop.why}`); });
  same(stops, [], 'auctions that stop');
});
test('buildSet is deterministic for a seed', () => {
  for (const d of SETS) same(JSON.stringify(buildSet(d, 3)), JSON.stringify(buildSet(d, 3)), d.id);
});
test('regression: the same seed deals the same hands on a slow device', () => {
  // The friend's version stopped dealing after 500 ms, so slow phones got different hands.
  const realNow = Date.now, realPerf = performance.now.bind(performance);
  for (const d of SETS) {
    const fast = JSON.stringify(buildSet(d, 2));
    let t = 0;
    Date.now = () => (t += 50);
    performance.now = () => (t += 50);
    try { same(JSON.stringify(buildSet(d, 2)), fast, d.id); }
    finally { Date.now = realNow; performance.now = realPerf; }
  }
});
test('every drill deals 15 hands, Mixed included', () => {
  for (const d of SETS) same(setSize(d), 15, d.id);
});
test('Mixed: a hand from every drill in each deal', () => {
  const M = SETS.find(d => d.id === 'mixed'), n = M.sources.length, seen = new Set();
  const a = buildSet(M, 1).map(q => q.src), b = buildSet(M, 2).map(q => q.src);
  same(new Set(a).size, Math.min(15, n), 'seed 1: every drill');
  same(new Set(b).size, Math.min(15, n), 'seed 2: every drill');
  for (let s = 1; s <= 2; s++) buildSet(M, s).forEach(q => seen.add(q.src));
  same(seen.size, n, 'a few deals in a row cover every drill');
});
test('our 1NT doubled, chart system: weak and 5-5 runs to the lower suit', () => {
  // Hands are [clubs, diamonds, hearts, spades]. ♠Q10852 ♥J10963 ♦4 ♣72: 3 HCP.
  const h = [[7, 2], [4], [11, 10, 9, 6, 3], [12, 10, 8, 5, 2]];
  const r = ntDoubledResp(h, false);
  same(r.bid, '2H', 'hearts and spades: 2H');
  const h2 = [[7, 2], [11, 10, 9, 6, 3], [4], [12, 10, 8, 5, 2]];
  same(ntDoubledResp(h2, false).bid, '2D', 'diamonds and spades: 2D');
});
test('after our redouble and their run, 5-5 bids the better suit when the lower is clearly better', () => {
  // The auction from the screenshot: 1C (X) XX (1H) P (P) to South. Hands are [clubs, diamonds, hearts, spades].
  const calls = ['1C', 'X', 'XX', '1H', 'P', 'P'];
  const q = [[11], [14, 13, 12, 10, 6], [8, 5], [11, 10, 5, 4, 3]];   // spades J10543, diamonds AKQ106
  same(penaltyFollow('S', calls, q, 'N').bid, '2D', 'AKQ diamonds beat J-high spades');
  const r = [[11], [14, 10, 6, 4, 2], [8, 5], [13, 10, 5, 4, 3]];     // spades K10543, diamonds A10642
  same(penaltyFollow('S', calls, r, 'N').bid, '1S', 'similar suits: higher-ranking first');
});
test('opener 11-14 with 6-4: show a 4-card major below the barrier, otherwise rebid the six', () => {
  // Hands are [clubs, diamonds, hearts, spades].
  const a = [[13, 4], [14, 12, 10, 7, 6, 3], [5], [13, 11, 8, 4]];          // 4-1-6-2, 13 HCP
  same(rebid(a, 1, 2, 1).bid, '1S', '1D-1H: 1S');
  const b = [[13, 4], [14, 12, 10, 7, 6, 3], [13, 11, 8, 4], [5]];          // 1-4-6-2
  same(rebid(b, 1, 3, 1).bid, '3D', '1D-1S: 2H would be a reverse; with 5 losers the six diamonds jump to 3D');
  const b6 = [[13, 4], [12, 10, 9, 7, 6, 3], [13, 11, 8, 4], [5]];           // 1-4-6-2, 6 losers
  same(rebid(b6, 1, 3, 1).bid, '2D', '1D-1S with 6 losers: 2D');
  const b7 = [[12, 11], [12, 10, 9, 7, 6, 3], [11, 9, 8, 4], [14]];         // 1-4-6-2, 11 HCP, 7 losers
  check(losers(b7) >= 7, 'b7 has 7 losers');
  same(rebid(b7, 1, 3, 1).bid, '2D', '1D-1S with 7 losers: 2H would be a reverse, so 2D');
  const c = [[4], [7, 5], [13, 11, 8, 4], [14, 12, 10, 7, 6, 3]];           // 6-4-2-1 in the majors
  same(rebid(c, 3, 0, 2).bid, '2H', '1S-2C: 2H is below 2S');
  const d = [[14, 12, 10, 7, 6, 3], [13, 4], [5], [13, 11, 8, 4]];          // 4-1-2-6 clubs
  same(rebid(d, 0, 2, 1).bid, '1S', '1C-1H: 1S');
});
test('transfer then 2NT: opener with 3+ in the major bids 3M with 15, 4M with 16-17', () => {
  // Hands are [clubs, diamonds, hearts, spades].
  const min3 = [[13, 9, 4], [14, 10, 6, 2], [12, 11, 5], [13, 8, 3]];   // 15 HCP, three spades
  same(sysCall(['1N', '2H', '2S', '2N'], min3).bid, '3S', '15 with three spades: 3S');
  const max3 = [[14, 9, 4], [14, 10, 6, 2], [14, 11, 5], [13, 8, 3]];   // 16 HCP, three spades
  same(sysCall(['1N', '2H', '2S', '2N'], max3).bid, '4S', '16 with three spades: 4S');
  const min2 = [[13, 9, 4, 3], [14, 10, 6, 2], [12, 11, 5], [13, 8]];   // 15 HCP, two spades
  same(sysCall(['1N', '2H', '2S', '2N'], min2).bid, 'P', '15 with two spades: pass');
  same(sysCall(['1N', '2D', '2H', '2N'], [[13, 9, 4], [14, 10, 6, 2], [13, 8, 3], [12, 11, 5]]).bid, '3H', 'hearts too');
});
test('opener 11-14: a 7-card suit or 5 losers jump rebids like 15-19', () => {
  // Hands are [clubs, diamonds, hearts, spades].
  const seven = [[9, 4], [8], [10, 6, 3], [14, 13, 10, 9, 7, 5, 2]];      // 7 spades, 7 HCP + ... = AK = 7
  seven[0] = [14, 4];                                                    // add the club ace: 11 HCP
  same(rebid(seven, 3, 0, 2).bid, '3S', '1S-2C: seven spades jump to 3S');
  const sixLosers = [[14, 4], [5], [13, 8, 3, 2], [14, 12, 10, 9, 7, 5]].map(x => x);  // 6-4-1-2
  sixLosers[3] = [14, 13, 11, 9, 7, 5]; sixLosers[2] = []; sixLosers[1] = [13, 8, 3, 2]; sixLosers[0] = [12, 4, 2];   // 6-0-4-3, 13 HCP, 5 losers
  check(losers(sixLosers) <= 5, 'test hand has 5 losers or fewer');
  same(rebid(sixLosers, 3, 0, 2).bid, '3S', '1S-2C: six spades and 5 losers jump to 3S');
  const plain6 = [[13, 4, 2], [12, 5], [8, 3], [14, 12, 10, 9, 7, 5]];    // 6-2-2-3, 11 HCP, 8 losers
  same(rebid(plain6, 3, 0, 2).bid, '2S', 'ordinary six-card minimum: 2S');
});
test('responder after opener rebids a six-card major: Qx is support, 10-12 invites', () => {
  const qx = [[13, 10, 6, 3], [14, 9, 7, 4], [13, 5, 2], [12, 6]];       // 2 spades (Qx), 3 hearts, 4-4 minors: 12 HCP
  same(respAfterRebid(qx, ['1S', '2D', '2S']).bid, '3S', 'Qx and 12: invite 3S');
  const small = [[13, 10, 6, 3], [14, 9, 7, 4], [8, 5, 2], [6, 2]];       // xx in spades, 10 HCP
  same(respAfterRebid(small, ['1S', '2D', '2S']).bid, 'P', 'small doubleton and 10: pass');
});
test('competitive: pre-emptive minor raise and raising a weak jump overcall', () => {
  const minor = [[8, 3], [13, 10, 9, 6, 4, 2], [9, 7, 5], [10, 4]];        // six diamonds, 3 HCP? K = 3 -> add a jack
  minor[3] = [11, 4];                                                      // 4 HCP
  same(negDbl(minor, 1, 3).bid, '3D', '1D (1S): 3D');
  const three = [[9, 6, 3], [13, 8, 4, 2], [12, 7, 5], [10, 8, 4]];        // three spades
  same(wjoRaise(three, 2, '2S').bid, '3S', '1H (2S): 3 spades -> 3S');
  const four = [[9, 6], [13, 8, 4, 2], [12, 7, 5], [10, 8, 4, 2]];         // four spades
  same(wjoRaise(four, 2, '2S').bid, '4S', '1H (2S): 4 spades -> 4S');
  const none = [[9, 6, 3, 2], [13, 8, 4, 2], [12, 7, 5, 3], [10]];
  same(wjoRaise(none, 2, '2S').bid, 'P', 'no fit: pass');
});
test('after the unassuming cue bid: 13+ HCP or 6 losers jumps to game', () => {
  // Hands are [clubs, diamonds, hearts, spades]. ♠AKQ752 ♥Q4 ♦4 ♣J1086: 12 HCP, 6 losers.
  const h = [[11, 10, 8, 6], [4], [12, 4], [14, 13, 12, 7, 5, 2]];
  same(ucbOvercaller(h, '1S', '2H').bid, '4S', '6 losers: 4S');
  const m = [[11, 10, 8], [9, 4], [12, 4, 3], [14, 13, 7, 5, 2]];       // 5-3-2-3, 11 HCP, 8 losers
  same(ucbOvercaller(m, '1S', '2H').bid, '2S', 'minimum: 2S');
});
test('with a fit, shape counts: losers can push a minimum into game', () => {
  // ♠98543 ♥A ♦AKQJ73 ♣Q as 1S - 2S: 16 HCP, 4 losers -> 4S. Hands are [clubs, diamonds, hearts, spades].
  const h = [[12], [14, 13, 12, 11, 7, 3], [14], [9, 8, 5, 4, 3]];
  same(sysCall(['1S', '2S'], h).bid, '4S', '4 losers opposite a simple raise: game');
  const flat = [[13, 4, 2], [12, 8, 3], [14, 9], [14, 13, 7, 5, 3]];     // 16 HCP, 7 losers
  same(sysCall(['1S', '2S'], flat).bid, '3S', 'flat 16: game try as before');
});
test('Mixed: most slam hands are small slams', () => {
  const M = SETS.find(d => d.id === 'mixed'); let six = 0, seven = 0;
  for (let s = 1; s <= 12; s++) buildSet(M, s).filter(q => q.src === 'slam').forEach(q => { if (/^6/.test(q.contract || '')) six++; if (/^7/.test(q.contract || '')) seven++; });
  check(six > seven, `small ${six}, grand ${seven}`);
});
test('any 1-suit auction: a fit plus losers reaches game (1H 1S 2D with 6 losers: 5D)', () => {
  // ♠AQ843 ♥- ♦86432 ♣A85: 10 HCP, 6 losers. Opener's 2♦ shows 4+ diamonds and about 7 losers.
  const h = [[14, 8, 5], [8, 6, 4, 3, 2], [], [14, 12, 8, 4, 3]];
  same(sysCall(['1H', '1S', '2D'], h).bid, '5D');
  same(sysCall(['1H', '1S', '2D', '5D'], [[13, 4], [14, 12, 9, 5], [14, 13, 9, 7, 2], [9, 6]]).bid, 'P', 'opener passes the game');
  const flat = [[14, 8, 5], [8, 6, 4, 3], [9, 2], [14, 12, 8, 4]];   // 4-2-4-3, 8 losers: no upgrade
  check(sysCall(['1H', '1S', '2D'], flat).bid !== '5D', 'flat hand stays low');
});
test('Mixed rotates through each drill\'s hand types: Cappelletti and unbalanced 2♣ come up', () => {
  const M = SETS.find(d => d.id === 'mixed'), ids = new Set();
  for (let s = 1; s <= 30; s++) buildSet(M, s).forEach(q => q.steps.forEach(st => ids.add(st.ans.id)));
  check([...ids].some(id => /^F\.cappelletti/.test(id)), 'Cappelletti in 30 Mixed deals');
  const B = SETS.find(d => d.id === 'big'), bi = new Set();
  for (let s = 1; s <= 4; s++) buildSet(B, s).forEach(q => q.steps.forEach(st => bi.add(st.ans.id)));
  check(bi.has('E.2c-rebid-suit') && bi.has('GUIDE.2c-rebid-answer'), 'unbalanced 2♣ auctions in the Strong openings drill');
});
test('2NT, transfer, then 3NT with exactly five cards even with a singleton', () => {
  same(choice2N([[11], [11, 10, 9, 7, 6, 4], [13], [10, 9, 7, 5, 4]], 3), true);
});
test('competitive auctions count losers too: support double, invited, 5 losers accepts', () => {
  // ♠A43 ♥- ♦Q862 ♣KQJ982 (12 HCP, 5 losers) after 1♣ (P) 1♠ (2♥) X (P) 3♠.
  const h = [[13, 12, 11, 9, 8, 2], [12, 8, 6, 2], [], [14, 4, 3]];
  same(supAfterInvite(h, 3, '3S').bid, '4S');
  const flat = [[13, 12, 9, 8], [12, 8, 6], [9, 4, 2], [14, 4, 3]];    // 3-3-3-4, 11 HCP, 8 losers
  same(supAfterInvite(flat, 3, '3S').bid, 'P');
});
test('responder with 4+ support: 7 losers counts as 13+, and a good side suit is shown first', () => {
  // ♠AK8432 ♥98432 ♦K8 ♣- opposite 1♥: 10 HCP, 5 losers -> 1♠ first.
  const h = [[], [13, 8], [9, 8, 4, 3, 2], [14, 13, 8, 4, 3, 2]];
  same(r1M(h, 2).bid, '1S');
  const j = [[13, 8, 4], [12, 8], [9, 8, 4, 3], [14, 12, 8, 4]];   // 4-4-2-3, 11 HCP, 8 losers: still 3♣
  same(r1M(j, 2).bid, '3C');
});
test('never repeat partner\'s bid: when the wanted game is already bid, pass', () => {
  const h = parseHand('K963.KQJ84.KJ8.K');
  same(sysCall(['1S', '2H', '4H'], h).bid, 'P');
});
test('only the slam drills keep slam hands', () => {
  same(SETS.filter(d => d.slam).map(d => d.id), ['slam', 'mixed']);
});
test('four-hand drills: the opponents bid and South makes every decision', () => {
  const southTurn = (q, n) => ['W', 'N', 'E', 'S'][(['W', 'N', 'E', 'S'].indexOf(q.dealer) + n) % 4] === 'S';
  for (const id of ['pen', 'their-nt', 'our-nt', 'ucb', 'support']) {
    const qs = buildSet(SETS.find(d => d.id === id), 1, { helvic: id === 'our-nt' });
    check(qs.some(q => q.on.length), `${id}: the opponents never bid`);
    check(qs.every(q => q.steps.every(st => southTurn(q, st.calls.length))), `${id}: a step is not at South's turn`);
  }
});
test('buildSet survives a recipe that never deals', () => {
  const qs = buildSet({ id: 'broken', recipes: [() => null, SETS[0].recipes[0]] }, 1);
  same(qs.length, SET_SIZE);
});

// ---------- Fuzz: random deals through the whole chart ----------
test('fuzz: 20,000 random deals never throw, bid illegally, or stop without a reason', () => {
  const rng = mulberry(2024);
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push([s, r]);
  for (let t = 0; t < 20000; t++) {
    shuffle(rng, deck);
    const hs = [0, 1].map(k => { const h = [[], [], [], []]; deck.slice(k * 13, k * 13 + 13).forEach(([s, r]) => h[s].push(r)); h.forEach(x => x.sort((a, b) => b - a)); return h; });
    const seq = [];
    for (let g = 0, who = 0; g < 30; g++, who ^= 1) {
      const c = sysCall(seq, hs[who]);
      if (!isCall(c)) {
        check(/^(ambiguous|gap)$/.test(c.stop) && typeof c.why === 'string' && c.why.length > 10, `no call and no reason after ${seq.join(' ')}`);
        break;
      }
      check(c.auto || RULE_ID.test(c.id), `rule id "${c.id}" after ${seq.join(' ')}`);
      const lb = [...seq].reverse().find(x => /^\d/.test(x));
      check(!/^\d/.test(c.bid) || !lb || bv(c.bid) > bv(lb), `insufficient ${c.bid} after ${seq.join(' ')}`);
      if (!c.auto) checkWhy(c.why, hs[who], seq.join(' ') + ' -> ' + c.bid);
      seq.push(c.bid);
      if (c.bid === 'P') break;
    }
  }
});
