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
test('opening: 5-5 majors open 1♥ (as the chart reads)', () => same(opening('AQ432.KQ432.2.32'), '1H'));
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

// ---------- F: competitive ----------
test('competitive: overcalls and doubles', () => {
  same(overcall(parseHand('KQ2.A32.KJ32.Q32'), 3).bid, '1N');
  same(overcall(parseHand('AQ32.2.KJ32.Q432'), 2).bid, 'X');
  same(negDbl(parseHand('KJ32.Q432.32.432'), 0, 1).bid, 'X');
  same(vs1NT(parseHand('AQ432.KJ32.32.32')).bid, '2D');
  same(advance(parseHand('432.Q8432.J32.32'), 0).bid, '1H');
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
  // Opener with 13 after a limit raise: the chart gives no call.
  const q = { partner: true, ...simulate(parseHand('K2.AQJ32.K32.432'), parseHand('8743.K54.AQ5.K65'), 'S', 'note') };
  same(q.calls, ['1H', 'P', '3H', 'P']);
  same(q.contract, null);
  same([q.stop.stop, q.stop.seat], ['gap', 'S']);
  check(/limit raise/.test(outcome(q)), outcome(q));
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
  same(callFor('1H 1S 2N', h), null, 'opener has 18-19: slam is possible, and the chart stops');
  same(callFor('1H 1S 1N', 'AQ52.Q63.KQ4.A92'), null, '17 HCP: slam is possible, and the chart stops');
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
const RULE_ID = /^(OB|[A-G])\.[a-z0-9]+(-[a-z0-9]+)*$/;
// Every rule id written in the code, found by reading the source of each global function.
function allRuleIds() {
  const ids = new Set();
  for (const k of Object.getOwnPropertyNames(window)) {
    let f;
    try { f = window[k]; } catch (e) { continue; }
    if (typeof f === 'function') for (const m of String(f).matchAll(/'((?:OB|[A-G])\.[^']*)'/g)) ids.add(m[1]);
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
function checkQuestion(q, where) {
  const hands = [q.hand, q.partner].filter(Boolean);
  for (const h of hands) {
    same(h.flat().length, 13, where + ' cards');
    h.forEach(s => check(new Set(s).size === s.length, where + ' duplicate card'));
  }
  if (q.partner) for (let s = 0; s < 4; s++) for (const r of q.hand[s]) check(!q.partner[s].includes(r), where + ' shared card');
  // The auction is legal call by call.
  q.calls.forEach((c, i) => {
    check(/^([1-7][CDHSN]|P|X|XX)$/.test(c), `${where}: bad call ${c}`);
    const lg = legal(q.dealer, q.calls.slice(0, i));
    if (/^\d/.test(c)) check(bv(c) > lg.min, `${where}: insufficient ${c} in ${q.calls.join(' ')}`);
    if (c === 'X') check(lg.x, `${where}: illegal double`);
    if (c === 'XX') check(lg.xx, `${where}: illegal redouble`);
  });
  check(q.steps.length > 0, where + ' no steps');
  q.steps.forEach((st, k) => {
    const lg = legal(q.dealer, st.calls), b = st.ans.bid;
    check(!/^\d/.test(b) || bv(b) > lg.min, `${where} step ${k}: answer ${b} is insufficient`);
    check(b !== 'X' || lg.x, `${where} step ${k}: answer X is not allowed`);
    check(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'OB'].includes(st.ans.ref), `${where} step ${k}: chart ref "${st.ans.ref}"`);
    check(RULE_ID.test(st.ans.id) && st.ans.id.split('.')[0] === st.ans.ref, `${where} step ${k}: rule id "${st.ans.id}"`);
    check(st.note, `${where} step ${k}: no note`);
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
for (const d of SETS) {
  test(`set "${d.id}": 25 good hands for seeds 1-20, built quickly`, () => {
    for (let seed = 1; seed <= 20; seed++) {
      const t0 = performance.now(), qs = buildSet(d, seed), ms = performance.now() - t0;
      same(qs.length, SET_SIZE, `seed ${seed} size`);
      check(ms < 1000, `seed ${seed} took ${ms.toFixed(0)} ms`);
      const keys = new Set(qs.map(q => JSON.stringify(q.hand)));
      check(keys.size === qs.length || d.id === 'comp' || d.id === 'mixed', `seed ${seed}: repeated hand`);
      qs.forEach((q, i) => checkQuestion(q, `${d.id}#${seed}/${i}`));
      qs.forEach(q => q.steps.forEach(st => ASKED.add(st.ans.id)));
    }
  });
}
{
  const all = allRuleIds(), never = [...all].filter(id => !ASKED.has(id)).sort();
  info('rule coverage', `${all.size - never.length} of ${all.size} chart rules are asked of you in some drill (seeds 1-20).\n       Never asked: ${never.join(', ')}`);
}
test('buildSet is deterministic for a seed', () => {
  for (const d of SETS) same(JSON.stringify(buildSet(d, 3)), JSON.stringify(buildSet(d, 3)), d.id);
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
