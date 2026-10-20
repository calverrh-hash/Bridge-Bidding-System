// The page: home screen, bidding box, feedback, results and saved progress.
//
// Everything is drawn by render() from the state object S:
//   { view: 'home' }
//   { view: 'play', id, qs, order, pos, step, cur, res, retry, level, answered }
//   { view: 'done', id, qs, order, res, retry }
'use strict';

// ---------- Saved progress (localStorage) ----------
// DB = { seed: {setId: n}, best: {setId: score}, prog: {setId: {seed, sig, res}} }
// res[i] is null until hand i is finished, then { bids, n, ok }.
// The tests set window.BIDTRAINER_KEY so they never touch real saved progress.
const KEY = window.BIDTRAINER_KEY || 'bidtrainer.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
};
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
function loadDB() {
  const d = store.get();
  return { seed: isObj(d.seed) ? d.seed : {}, best: isObj(d.best) ? d.best : {}, prog: isObj(d.prog) ? d.prog : {} };
}
let DB = loadDB();
const save = () => store.set(DB);
const seedOf = id => Number.isInteger(DB.seed[id]) && DB.seed[id] > 0 ? DB.seed[id] : 1;
const bestOf = id => Number.isInteger(DB.best[id]) ? DB.best[id] : null;

// ---------- Sets ----------
const cache = {};
function getSet(id) {
  const seed = seedOf(id), k = id + '#' + seed;
  if (!cache[k]) cache[k] = buildSet(SETS.find(d => d.id === id), seed);
  return cache[k];
}
// A fingerprint of the dealt hands and answers. If the drills change, so does this,
// and saved progress for the old hands is thrown away instead of being misread.
function setSig(qs) {
  let h = 0;
  const s = JSON.stringify(qs.map(q => [q.hand, q.steps.map(st => st.ans.bid)]));
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}
// Saved progress for a set, or null if there is none or it belongs to other hands.
function progressFor(id) {
  const pr = DB.prog[id], qs = getSet(id);
  if (!isObj(pr) || pr.seed !== seedOf(id) || pr.sig !== setSig(qs) || !Array.isArray(pr.res) || pr.res.length !== qs.length) return null;
  return pr;
}

// ---------- Formatting ----------
const REF = {
  A: 'Chart A · Responses to 1NT', B: 'Chart B · Responses to 1♥/♠', C: 'Chart C · Responses to 1♣/♦',
  D: "Chart D · Opener's rebid", E: 'Chart E · 2NT, 2♣, weak twos, pre-empts', F: 'Chart F · Competitive auctions',
  G: 'Chart G · Slam tools', OB: 'Chart · Opening bids',
};
const SEATS = ['W', 'N', 'E', 'S'];
const app = document.getElementById('app');
let S = { view: 'home' };

const suitClass = s => s === 1 || s === 2 ? 'r' : 'k';
// Colour the suit symbols in a piece of text.
const rich = t => t.replace(/[♥♦]/g, m => `<span class="r">${m}</span>`).replace(/[♠♣]/g, m => `<span class="k">${m}</span>`);
// A call as HTML: '3H' -> 3 and a red heart.
function fmt(b) {
  if (b === 'P') return 'Pass';
  if (b === 'X' || b === 'XX') return b;
  const s = ST.indexOf(b[1]);
  return b[0] + (s === 4 ? 'NT' : `<span class="${suitClass(s)}">${SY[s]}</span>`);
}
const ok = r => !!(r && r.ok);
const countOk = (order, res) => order.filter(j => ok(res[j])).length;

function handHTML(h, showStats, label) {
  const rows = [3, 2, 1, 0].map(s => `<div class="row"><span class="s ${suitClass(s)}">${SY[s]}</span><span class="cards">${h[s].length ? h[s].map(r => RANK[r] || r).join(' ') : '<span class="void">—</span>'}</span></div>`).join('');
  const stats = showStats ? `<div class="stats"><span>${hcp(h)} HCP</span><span>Shape ${shapeStr(h)} (♠-♥-♦-♣)</span></div>` : '';
  return `<div class="hand">${label ? `<span class="eyebrow">${label}</span>` : ''}${rows}${stats}</div>`;
}
// you: undefined = no extra cell, '?' = your turn, a call = your call.
function auctionHTML(dealer, calls, you) {
  const st = SEATS.indexOf(dealer);
  let c = '';
  for (let i = 0; i < st; i++) c += '<div class="ac"></div>';
  calls.forEach(b => c += `<div class="ac">${fmt(b)}</div>`);
  if (you) c += `<div class="ac you ${you === '?' ? 'ask' : ''}">${you === '?' ? '?' : fmt(you)}</div>`;
  return `<div class="table"><div class="auc"><div class="hd">W<small>LHO</small></div><div class="hd">N<small>Partner</small></div><div class="hd">E<small>RHO</small></div><div class="hd">S<small>You</small></div>${c}</div></div>`;
}
// Which calls South may make: min = rank of the last bid, plus whether X / XX are allowed.
function legal(dealer, calls) {
  const st = SEATS.indexOf(dealer);
  let last = null, li = -1;
  calls.forEach((c, i) => { if (c !== 'P') { last = c; li = i; } });
  const seat = li >= 0 ? SEATS[(st + li) % 4] : null, opp = seat === 'E' || seat === 'W';
  const lb = [...calls].reverse().find(c => /^\d/.test(c));
  return { min: lb ? bv(lb) : -1, x: !!last && /^\d/.test(last) && opp, xx: last === 'X' && opp };
}
function outcome(q) {
  if (q.contract) return `Final contract: ${fmt(q.contract)}.`;
  if (!q.partner) return '';   // one-call competitive drill
  if (!q.calls.some(c => /^\d/.test(c))) return 'Nobody opens: the hand is passed out.';
  return 'The chart stops here, so the drill ends.';
}
const outHTML = q => { const o = outcome(q); return o ? `<p class="out">${o}</p>` : ''; };

// ---------- Views ----------
function home() {
  const cards = SETS.map(d => {
    const qs = getSet(d.id), pr = progressFor(d.id), size = qs.length;
    const done = pr ? pr.res.filter(Boolean).length : 0, best = bestOf(d.id);
    return `<button class="set" data-set="${d.id}"><div class="set-top"><h3>${rich(d.name)}</h3><span class="chip">${rich(d.refs)}</span></div><p>${rich(d.blurb)}</p>
    <div class="meter"><i style="width:${size ? done / size * 100 : 0}%"></i></div><div class="set-foot"><span>${done ? `${done} / ${size} played` : `${size} hands`}</span><span>${best != null ? `Best ${best}/${size}` : 'Not finished yet'}</span></div></button>`;
  }).join('');
  app.innerHTML = `<div class="intro"><span class="eyebrow">5-card majors · strong NT</span><h1>Bidding drills</h1><p class="muted">You sit South and bid the whole auction. After each call, partner bids on from a real hand by the same chart, and you make your next call. A hand counts as correct only when every call matches the chart.</p></div><div class="sets">${cards}</div>`;
  app.querySelectorAll('.set').forEach(b => b.onclick = () => start(b.dataset.set));
}

// Start or resume a set. With `order` (a list of hand indexes), replay just those hands.
function start(id, order) {
  const qs = getSet(id), seed = seedOf(id), size = qs.length;
  if (!size) throw new Error(`Drill "${id}" dealt no hands.`);
  let pr = progressFor(id);
  if (!pr) { pr = { seed, sig: setSig(qs), res: Array(size).fill(null) }; DB.prog[id] = pr; }
  const ord = order || [...Array(size).keys()];
  const pos = order ? 0 : ord.findIndex(i => !pr.res[i]);
  if (pos < 0) { S = { view: 'done', id, qs, order: ord, res: pr.res, retry: false }; return render(); }
  S = { view: 'play', id, qs, order: ord, pos, step: 0, cur: [], res: order ? Array(size).fill(null) : pr.res, retry: !!order, level: null, answered: null };
  render();
}

function play() {
  const i = S.order[S.pos], q = S.qs[i], d = SETS.find(x => x.id === S.id), st = q.steps[S.step], last = S.step === q.steps.length - 1;
  const nOk = countOk(S.order, S.res);
  const dots = S.retry ? '' : `<div class="dots" style="grid-template-columns:repeat(${S.qs.length},1fr)">${S.qs.map((_, j) => `<i class="${j === i ? 'cur' : S.res[j] ? (S.res[j].ok ? 'ok' : 'no') : ''}"></i>`).join('')}</div>`;
  const pips = q.steps.length > 1 ? `<div class="pips">${q.steps.map((_, k) => `<i class="${k < S.step ? (S.cur[k] === q.steps[k].ans.bid ? 'ok' : 'no') : k === S.step ? (S.answered ? (S.answered === st.ans.bid ? 'ok' : 'no') : 'cur') : ''}"></i>`).join('')}<span>Call ${S.step + 1} of ${q.steps.length}</span></div>` : '';
  const prevWrong = S.step > 0 && S.cur[S.step - 1] !== q.steps[S.step - 1].ans.bid;
  let lower;
  if (S.answered) {
    // Feedback on the call just made, and on the last call the whole hand.
    const a = st.ans, good = S.answered === a.bid;
    let fin = '';
    if (last) {
      const pc = q.pn.filter(x => !x.auto);
      fin = `<div class="reveal"><span class="eyebrow">The whole hand</span>${auctionHTML(q.dealer, q.calls)}${outHTML(q)}
        ${q.partner ? handHTML(q.partner, true, "Partner's hand") : ''}
        ${pc.length ? `<div class="pcalls"><span class="eyebrow">Partner's calls</span>${pc.map(x => `<p><b>${fmt(x.call)}</b> ${rich(x.why)}</p>`).join('')}</div>` : ''}</div>`;
    }
    const nextLabel = !last ? 'Continue the auction →' : S.pos === S.order.length - 1 ? 'See results' : 'Next hand →';
    lower = `<div class="fb ${good ? 'ok' : 'no'}" role="status"><div class="verdict">${good ? 'Correct' : `Chart says ${fmt(a.bid)}`}</div>
      ${good ? '' : `<p>You bid ${fmt(S.answered)}.${last ? '' : ' The auction continues with the chart call.'}</p>`}<p>${rich(a.why)}</p><span class="ref">${rich(REF[a.ref] || '')}</span></div>
      ${fin}<div class="actions"><button class="primary" id="next">${nextLabel}</button></div>`;
  } else {
    // The bidding box: pick a level, then a strain; or Pass / X / XX.
    const lg = legal(q.dealer, st.calls), lv = S.level;
    const lvB = [1, 2, 3, 4, 5, 6, 7].map(n => `<button class="bc ${lv === n ? 'on' : ''}" data-lv="${n}" aria-pressed="${lv === n}" ${bv(n + 'N') <= lg.min ? 'disabled' : ''}>${n}</button>`).join('');
    const stB = [0, 1, 2, 3, 4].map(s => {
      const dis = !lv || bv(lv + ST[s]) <= lg.min;
      return `<button class="bc" data-st="${s}" aria-label="${s === 4 ? 'no-trump' : SN[s]}" ${dis ? 'disabled' : ''}>${s === 4 ? 'NT' : `<span class="${suitClass(s)}">${SY[s]}</span>`}</button>`;
    }).join('');
    lower = `<div class="box"><div class="brow lv">${lvB}</div><div class="brow st">${stB}</div>
      <div class="brow ac3"><button class="bc p" data-call="P">Pass</button><button class="bc x" data-call="X" ${lg.x ? '' : 'disabled'}>X</button><button class="bc xx" data-call="XX" ${lg.xx ? '' : 'disabled'}>XX</button></div>
      <p class="hint">${lv ? `Now pick a strain for level ${lv}.` : 'Pick a level, then a strain.'}</p></div>`;
  }
  app.innerHTML = `<div class="bar"><button class="back" id="back">‹ All drills</button><span class="count">Hand ${S.pos + 1} / ${S.order.length} · ${nOk} correct</span></div>
    ${dots}<div class="lead"><span class="eyebrow">${S.retry ? 'Retrying misses · ' : ''}${rich(d.name)}</span>${pips}<p class="note">${rich(st.note)}${prevWrong ? ' <span class="muted">(The auction went on with the chart call.)</span>' : ''}</p></div>
    ${auctionHTML(q.dealer, st.calls, S.answered || '?')}${handHTML(q.hand, !!S.answered)}${lower}`;
  document.getElementById('back').onclick = goHome;
  app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { S.level = +b.dataset.lv; render(); });
  app.querySelectorAll('[data-st]').forEach(b => b.onclick = () => answer(S.level + ST[+b.dataset.st]));
  app.querySelectorAll('[data-call]').forEach(b => b.onclick = () => answer(b.dataset.call));
  const nx = document.getElementById('next');
  if (nx) { nx.onclick = next; nx.focus({ preventScroll: true }); }
}

function answer(b) {
  const i = S.order[S.pos], q = S.qs[i];
  S.answered = b;
  S.cur[S.step] = b;
  if (S.step === q.steps.length - 1) {
    const n = q.steps.filter((st, k) => S.cur[k] === st.ans.bid).length;
    S.res[i] = { bids: S.cur.slice(), n, ok: n === q.steps.length };
    if (!S.retry) {
      // Record the best score as soon as the last hand is answered, even if the
      // user leaves before pressing "See results".
      if (S.res.every(Boolean)) DB.best[S.id] = Math.max(bestOf(S.id) || 0, countOk(S.order, S.res));
      save();
    }
  }
  render();
}

function next() {
  const q = S.qs[S.order[S.pos]];
  S.answered = null;
  S.level = null;
  if (S.step < q.steps.length - 1) { S.step++; render(); return; }
  S.step = 0;
  S.cur = [];
  if (S.pos < S.order.length - 1) S.pos++;
  else S.view = 'done';
  render();
  window.scrollTo({ top: 0 });
}

function done() {
  const d = SETS.find(x => x.id === S.id), size = S.qs.length, sc = countOk(S.order, S.res), miss = S.order.filter(j => !ok(S.res[j]));
  let calls = 0, callsOk = 0;
  S.order.forEach(j => { calls += S.qs[j].steps.length; if (S.res[j]) callsOk += S.res[j].n; });
  const rows = S.order.map(j => {
    const q = S.qs[j], r = S.res[j], good = ok(r);
    const stepRows = q.steps.map((st, k) => {
      const yb = r && r.bids[k], g = yb === st.ans.bid;
      return `<div class="srow"><span class="mk ${g ? 'ok' : 'no'}">${g ? '✓' : '✗'}</span><div><b>${fmt(st.ans.bid)}</b>${g ? '' : ` <span class="muted">(you: ${yb ? fmt(yb) : '—'})</span>`} ${rich(st.ans.why)}</div></div>`;
    }).join('');
    return `<details><summary><span class="mk ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span class="sm">${rich(q.steps[0].note)}</span><span class="cmp">${r ? r.n : 0}/${q.steps.length} calls</span></summary>
    <div class="det">${auctionHTML(q.dealer, q.calls)}${outHTML(q)}<div class="pair">${handHTML(q.hand, true, 'Your hand')}${q.partner ? handHTML(q.partner, true, "Partner's hand") : ''}</div>${stepRows}</div></details>`;
  }).join('');
  app.innerHTML = `<div class="bar"><button class="back" id="back">‹ All drills</button><span class="count">${S.retry ? 'Retry' : `Best ${bestOf(S.id) ?? sc}/${size}`}</span></div>
    <div class="intro"><span class="eyebrow">${rich(d.name)}</span><div class="score">${sc}<span class="muted" style="font-size:24px"> / ${S.order.length} hands</span></div>
    <p class="muted">${callsOk} of ${calls} calls matched the chart. ${miss.length ? `${miss.length} hands to review. Tap one to see both hands and every call.` : 'Every hand was bid perfectly.'}</p></div>
    <div class="actions">${miss.length ? '<button class="primary" id="retry">Retry the hands I missed</button>' : ''}<button class="ghost" id="fresh">Deal ${size} new hands</button></div>
    <div class="review">${rows}</div>`;
  document.getElementById('back').onclick = goHome;
  const rt = document.getElementById('retry');
  if (rt) rt.onclick = () => start(S.id, miss);
  document.getElementById('fresh').onclick = () => { DB.seed[S.id] = seedOf(S.id) + 1; delete DB.prog[S.id]; save(); start(S.id); };
}

function goHome() { S = { view: 'home' }; render(); }

// If anything goes wrong, show a way out instead of a blank page.
function crashed(e) {
  console.error(e);
  app.innerHTML = `<div class="intro"><h1>Something went wrong</h1><p class="muted">The trainer hit an error. Going back to the drills usually fixes it. If it keeps happening, resetting saved progress clears any damaged data (this also clears your best scores).</p></div>
    <div class="actions"><button class="primary" id="home">Back to the drills</button><button class="ghost" id="reset">Reset saved progress</button></div>
    <p class="muted"><small>${String(e && e.message || e).replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;')}</small></p>`;
  document.getElementById('home').onclick = goHome;
  document.getElementById('reset').onclick = () => { DB = { seed: {}, best: {}, prog: {} }; save(); goHome(); };
}

function render() {
  try {
    if (S.view === 'home') home();
    else if (S.view === 'play') play();
    else done();
  } catch (e) {
    crashed(e);
  }
}
// Errors inside click handlers happen outside render(), so catch those too.
window.addEventListener('error', e => crashed(e.error || e.message));
render();
