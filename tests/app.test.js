// App tests: drive the real page by clicking its buttons. Uses its own storage key
// (window.BIDTRAINER_KEY, set in tests/index.html), so real progress is never touched.
'use strict';

const $ = sel => document.querySelector('#app ' + sel);
const click = sel => { const b = $(sel); check(b, 'no button ' + sel); check(!b.disabled, 'disabled ' + sel); b.click(); };
function resetApp() { localStorage.removeItem(KEY); DB = loadDB(); goHome(); }
// Make the current call in the bidding box: the chart's answer, or `wrong` instead.
function bid(wrong) {
  const b = wrong || S.qs[S.order[S.pos]].steps[S.step].ans.bid;
  if (/^\d/.test(b)) { click(`[data-lv="${b[0]}"]`); click(`[data-st="${ST.indexOf(b[1])}"]`); }
  else click(`[data-call="${b}"]`);
}
// A legal call that differs from the chart's answer.
function wrongCall() {
  const st = S.qs[S.order[S.pos]].steps[S.step];
  return st.ans.bid === 'P' ? '7N' : 'P';
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
    const lvl = +st.calls.filter(c => /^\d/.test(c)).pop()[0];
    click(`[data-lv="${lvl}"]`);
    document.querySelectorAll('#app [data-st]').forEach(b => same(b.disabled, bv(lvl + ST[+b.dataset.st]) <= lg.min, 'strain ' + b.dataset.st));
  }
});
test('app: perfect run scores 25 and saves the best score', () => {
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
  check(/Best 25\/25/.test(document.querySelector('#app [data-set="comp"]').textContent), 'home card shows the best score');
});
test('app: progress resumes where you left off', () => {
  resetApp();
  click('[data-set="comp"]');
  for (let i = 0; i < 3; i++) { bid(); click('#next'); }
  click('#back');
  check(/3 \/ 25 played/.test(document.querySelector('#app [data-set="comp"]').textContent), 'home shows 3 played');
  click('[data-set="comp"]');
  same(S.pos, 3);
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
  same(loadDB(), { seed: {}, best: {}, prog: {} });
  localStorage.setItem(KEY, JSON.stringify({ seed: 'x', best: [1], prog: { comp: { seed: 1, res: 'oops' } } }));
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
    check($('.hand') && $('.box'), d.id + ' shows hand and bidding box');
  }
  resetApp();
});
