// App tests: drive the real page by clicking its buttons. Uses its own storage key
// (window.BIDTRAINER_KEY, set in tests/index.html), so real progress is never touched.
'use strict';

const $ = sel => document.querySelector('#app ' + sel);
const click = sel => { const b = $(sel); check(b, 'no button ' + sel); check(!b.disabled, 'disabled ' + sel); b.click(); };
function resetApp() { localStorage.removeItem(KEY); DB = loadDB(); goHome(); }
const curStep = () => S.qs[S.order[S.pos]].steps[S.step];
// Answer the current step: the chart's answer, or `wrong` instead. Number steps use the pad.
function bid(wrong) {
  const st = curStep(), b = wrong || st.ans.bid;
  if (st.kind === 'num') click(`[data-num="${b}"]`);
  else if (/^\d/.test(b)) { click(`[data-lv="${b[0]}"]`); click(`[data-st="${ST.indexOf(b[1])}"]`); }
  else click(`[data-call="${b}"]`);
}
// An allowed answer that differs from the chart's.
function wrongCall() {
  const st = curStep();
  if (st.kind === 'num') return st.opts.find(v => v !== st.ans.bid);
  return st.ans.bid === 'P' ? '7N' : 'P';
}
// Answer every step of the current hand (getting the first wrong if asked), stopping on the
// last step's feedback.
function playHand(wrongFirst) {
  const q = S.qs[S.order[S.pos]];
  for (let k = 0; k < q.steps.length; k++) {
    bid(wrongFirst && k === 0 ? wrongCall() : null);
    if (k < q.steps.length - 1) click('#next');
  }
}
// Play every remaining call; missHands lists hand positions to get wrong.
function playOut(missHands = []) {
  for (let guard = 0; S.view === 'play' && guard < 500; guard++) {
    bid(missHands.includes(S.pos) ? wrongCall() : null);
    click('#next');
  }
}

test('app: home lists every drill set', () => {
  resetApp();
  same(document.querySelectorAll('#app .set').length, SETS.length);
});
test('app: a level button greys out strains below the last bid', () => {
  resetApp();
  click('[data-set="comp"]');
  const st = S.qs[S.order[S.pos]].steps[0];
  const lg = legal(S.qs[S.order[S.pos]].dealer, st.calls);
  if (lg.min >= 0) {
    // The last bid's level, or the next one up if it was no-trump (nothing left at that level).
    const lastBid = st.calls.filter(c => /^\d/.test(c)).pop(), lvl = +lastBid[0] + (lastBid[1] === 'N' ? 1 : 0);
    click(`[data-lv="${lvl}"]`);
    document.querySelectorAll('#app [data-st]').forEach(b => same(b.disabled, bv(lvl + ST[+b.dataset.st]) <= lg.min, 'strain ' + b.dataset.st));
  }
});
test('app: perfect run scores a full set and saves the best score', () => {
  resetApp();
  click('[data-set="nt-resp"]');
  playOut();
  same(S.view, 'done');
  same(countOk(S.order, S.res), SET_SIZE);
  same(loadDB().best['nt-resp'], SET_SIZE);
});
test('regression: best score is saved even if you leave before "See results"', () => {
  resetApp();
  click('[data-set="comp"]');
  for (let guard = 0; guard < 500; guard++) {
    const last = S.pos === S.order.length - 1 && S.step === S.qs[S.order[S.pos]].steps.length - 1;
    bid();
    if (last) break;
    click('#next');
  }
  click('#back');   // leave without pressing "See results"
  same(loadDB().best.comp, SET_SIZE);
  check(/Best 10\/10/.test(document.querySelector('#app [data-set="comp"]').textContent), 'home card shows the best score');
});
test('app: progress resumes where you left off', () => {
  resetApp();
  click('[data-set="comp"]');
  for (let i = 0; i < 3; i++) { playHand(); click('#next'); }
  click('#back');
  check(/3 \/ 10 played/.test(document.querySelector('#app [data-set="comp"]').textContent), 'home shows 3 played');
  click('[data-set="comp"]');
  same(S.pos, 3);
});
test('app: clicking a dot jumps to that hand; "next" goes to the next unplayed hand', () => {
  resetApp();
  click('[data-set="comp"]');
  click('[data-jump="4"]');
  same(S.pos, 4);
  playHand(); click('#next');
  same(S.pos, 5, 'next unplayed after 4');
  click(`[data-jump="${SET_SIZE - 1}"]`);
  playHand(); click('#next');
  same(S.pos, 0, 'wraps round to the first unplayed hand');
});
test('app: playing hands out of order still finishes the set and saves the best score', () => {
  resetApp();
  click('[data-set="comp"]');
  click('[data-jump="7"]');
  playOut();
  same(S.view, 'done');
  same(S.res.filter(Boolean).length, SET_SIZE, 'every hand played');
  same(loadDB().best.comp, SET_SIZE);
});
test('app: "See results" appears only when no hand is left unplayed', () => {
  resetApp();
  click('[data-set="comp"]');
  click(`[data-jump="${SET_SIZE - 1}"]`);
  playHand();
  same($('#next').textContent, 'Next hand →');
});
test('app: a played hand can be bid again for practice; its first result stands', () => {
  resetApp();
  click('[data-set="comp"]');
  playHand(true); click('#next');
  same(S.res[S.order[0]].ok, false);
  click(`[data-jump="${S.order[0]}"]`);
  same(S.pos, 0);
  check(/Practice/.test($('.lead').textContent), 'marked as practice');
  playHand();
  check($('.fb.ok'), 'feedback is still shown');
  click('#next');
  same(S.res[S.order[0]].ok, false, 'first result stands');
  same(loadDB().prog.comp.res[S.order[0]].ok, false, 'saved result unchanged');
  same(S.pos, 1, 'next goes on to the next unplayed hand');
});
test('regression: bidding a missed hand again after seeing the answer does not raise the best score', () => {
  resetApp();
  click('[data-set="comp"]');
  playHand(true); click('#next');   // miss the first hand
  for (let guard = 0; guard < 100; guard++) { playHand(); if (nextUnplayed() < 0) break; click('#next'); }
  // Every hand is answered but "See results" has not been pressed, so the dots are still there.
  same(loadDB().best.comp, SET_SIZE - 1);
  click(`[data-jump="${S.order[0]}"]`);
  playHand();
  same(loadDB().best.comp, SET_SIZE - 1, 'best score unchanged');
  same(countOk(S.order, S.res), SET_SIZE - 1, 'score unchanged');
});
test('app: retry replays only the missed hands, then a fresh deal resets', () => {
  resetApp();
  click('[data-set="comp"]');
  playOut([0, 4]);
  same(S.view, 'done');
  same(countOk(S.order, S.res), SET_SIZE - 2);
  click('#retry');
  same(S.order.length, 2);
  playOut();
  same(S.view, 'done');
  same(loadDB().best.comp, SET_SIZE - 2, 'retries do not change the best score');
  click('#fresh');
  same(loadDB().seed.comp, 2);
  same(S.view, 'play');
  same(S.pos, 0);
});
test('app: damaged saved data is ignored, not fatal', () => {
  localStorage.setItem(KEY, '{not json');
  same(loadDB(), { seed: {}, best: {}, prog: {}, opts: { helvic: false } });
  localStorage.setItem(KEY, JSON.stringify({ seed: 'x', best: [1], prog: { comp: { seed: 1, res: 'oops' } }, opts: 'bad' }));
  DB = loadDB();
  same(seedOf('comp'), 1);
  same(progressFor('comp'), null);
  goHome();
  same(document.querySelectorAll('#app .set').length, SETS.length);
  resetApp();
});
test('app: progress saved for different hands is discarded', () => {
  resetApp();
  DB.prog.comp = { seed: 1, sig: 'not-these-hands', res: Array(SET_SIZE).fill({ bids: ['P'], n: 1, ok: true }) };
  same(progressFor('comp'), null);
  click('[data-set="comp"]');
  same(S.pos, 0);
});
test('app: an error shows a recovery screen instead of a blank page', () => {
  resetApp();
  crashed(new Error('test <b>error</b>'));
  check(/Something went wrong/.test($('h1').textContent));
  check(!$('b'), 'error message is escaped');
  click('#home');
  same(document.querySelectorAll('#app .set').length, SETS.length);
});
test('app: every set opens and renders its first hand', () => {
  for (const d of SETS) {
    resetApp();
    click(`[data-set="${d.id}"]`);
    same(S.view, 'play', d.id);
    check($('.hand') && $('.box'), d.id + ' shows hand and the bidding box or number pad');
  }
  resetApp();
});
test('app: the home screen does not deal the sets (so it opens quickly)', () => {
  resetApp();
  const real = window.getSet;
  let calls = 0;
  window.getSet = id => { calls++; return real(id); };
  try { goHome(); } finally { window.getSet = real; }
  same(calls, 0);
});
test('app: Mixed is listed last', () => {
  resetApp();
  const ids = [...document.querySelectorAll('#app .set')].map(b => b.dataset.set);
  same(ids[ids.length - 1], 'mixed');
});
test('app: the Helvic switch changes the system and keeps separate progress', () => {
  resetApp();
  click('[data-set="our-nt"]');
  playHand(); click('#next');
  click('#back');
  click('#m-helvic');
  same(loadDB().opts.helvic, true);
  check(/Playing Helvic Wriggle/.test($('[data-set="our-nt"]').textContent), 'card says Helvic');
  check(/10 hands/.test($('[data-set="our-nt"]').textContent), 'Helvic progress starts empty');
  click('[data-set="our-nt"]');
  check(S.qs.some(q => q.steps.some(st => st.ans.ref === 'H')), 'Helvic hands are dealt');
  click('#back');
  click('#m-chart');
  check(/1 \/ 10 played/.test($('[data-set="our-nt"]').textContent), 'chart progress kept');
  resetApp();
});
test('app: LTC steps use the number pad, then the bidding box', () => {
  resetApp();
  click('[data-set="ltc"]');
  check($('[data-num]') && !$('[data-lv]'), 'number pad first');
  bid(); click('#next');
  check($('[data-num]'), 'number pad for tricks');
  bid();
  const q = S.qs[S.order[S.pos]];
  if (q.steps.length === 3) { click('#next'); check($('[data-lv]'), 'then the bidding box'); }
  resetApp();
});
test('app: the whole hand shows the opponents\' calls in four-hand drills', () => {
  resetApp();
  click('[data-set="pen"]');
  playHand();
  check(/Opponents' calls/.test(app.textContent), 'opponents listed');
  resetApp();
});
test('app: the Continue button sits above the bidding table', () => {
  resetApp();
  click('[data-set="nt-resp"]');
  click('[data-call="P"]');
  const nx = $('#next'), table = $('.table');
  check(!!(nx && table && (nx.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Continue comes before the table');
});
test('app: "New hands for every drill" moves every drill to new hands and keeps best scores', () => {
  resetApp();
  DB.best.comp = 7; DB.seed.comp = 3; DB.prog.comp = { seed: 3, sig: 'x', res: [] }; save();
  click('#newall');
  const d = loadDB();
  same(d.seed.comp, 4, 'comp moved to the next seed');
  same(d.seed['nt-resp'], 2, 'untouched drills move too');
  same(d.seed['our-nt~helvic'], 2, 'Helvic versions move too');
  same(Object.keys(d.prog).length, 0, 'unfinished progress cleared');
  same(d.best.comp, 7, 'best score kept');
});
