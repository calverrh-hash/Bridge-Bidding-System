// The page: home screen, system switch, bidding box, number pad, feedback, results and saved progress.
//
// Everything is drawn by render() from the state object S:
//   { view: 'home' }
//   { view: 'play', id, key, qs, order, pos, step, cur, res, retry, practice, level, answered }
//   { view: 'done', id, key, qs, order, res, retry }
'use strict';

// ---------- Saved progress (localStorage) ----------
// DB = { seed: {key: n}, best: {key: score}, prog: {key: {seed, sig, res}}, opts: {helvic} }
// key is the set id, plus '~helvic' for sets whose hands depend on the Helvic option.
// res[i] is null until hand i is finished, then { bids, n, ok }.
// The tests set window.BIDTRAINER_KEY so they never touch real saved progress.
const KEY = window.BIDTRAINER_KEY || 'bidtrainer.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
  set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
};
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);
function loadDB() {
  const d = store.get(), o = (k) => isObj(d[k]) ? d[k] : {};
  return { seed: o('seed'), best: o('best'), prog: o('prog'), opts: { helvic: o('opts').helvic === true, acol: o('opts').acol === true, ogust: o('opts').ogust === true,
    acolHelvic: o('opts').acolHelvic === true, acolOgust: o('opts').acolOgust !== false } };
}
let DB = loadDB();
const save = () => store.set(DB);
// The drills for the system being practised: 5-card majors / strong NT, or Acol / weak NT.
const ALL_SETS = () => SETS.concat(ACOL_SETS);
const sets = () => DB.opts.acol ? ACOL_SETS : SETS;
const setDef = id => ALL_SETS().find(x => x.id === id);
// Each system keeps its own Helvic and Ogust switches. Acol starts on Ogust (its chart), 5CM on features.
const optKey = (ac, k) => ac ? 'acol' + k[0].toUpperCase() + k.slice(1) : k;
const optOn = (d, k) => !!(d && DB.opts[optKey(d.acol, k)]);
const ogustOn = d => optOn(d, 'ogust');
const helvicOn = d => !!(d && d.helvic) && optOn(d, 'helvic');
const keyOf = id => { const d = setDef(id); return id + (helvicOn(d) ? '~helvic' : '') + (ogustOn(d) ? '~ogust' : ''); };
const seedOf = key => Number.isInteger(DB.seed[key]) && DB.seed[key] > 0 ? DB.seed[key] : 1;
const bestOf = key => Number.isInteger(DB.best[key]) ? DB.best[key] : null;

// ---------- Sets ----------
const cache = {};
function getSet(id) {
  const key = keyOf(id), seed = seedOf(key), k = key + '#' + seed;
  if (!cache[k]) cache[k] = buildSet(setDef(id), seed, { helvic: helvicOn(setDef(id)), ogust: ogustOn(setDef(id)) });
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
// Saved progress for a set, or null if there is none or it belongs to other hands. Deals the set.
function progressFor(id) {
  const key = keyOf(id), pr = DB.prog[key], qs = getSet(id);
  if (!isObj(pr) || pr.seed !== seedOf(key) || pr.sig !== setSig(qs) || !Array.isArray(pr.res) || pr.res.length !== qs.length) return null;
  return pr;
}
// Hands played, for the home screen. Cheap: it doesn't deal the set (progressFor checks it on opening).
function playedCount(id) {
  const key = keyOf(id), pr = DB.prog[key];
  return isObj(pr) && pr.seed === seedOf(key) && Array.isArray(pr.res) ? pr.res.filter(Boolean).length : 0;
}

// ---------- Formatting ----------
const REF_ACOL = {
  A: 'Acol chart A · Responses to 1NT (12-14)', B: 'Acol chart B · Responses to 1♣/♦/♥/♠', C: "Acol chart C · Opener's NT rebids", D: "Acol chart D · Opener's suit rebids",
  E: 'Acol chart E · 2NT, weak twos, 2♣', F: 'Acol chart F · Overcalls and doubles', G: 'Acol chart G · Blackwood, losing tricks', H: 'Acol chart H · Pre-empts, their 1NT',
  OB: 'Acol chart · Opening bids', LTC: 'Acol chart G · Losing trick count', GUIDE: 'Trainer guide (the chart is silent here)',
};
// Options played in Acol that its chart doesn't have are labelled as such.
const refOf = (id, rule) => {
  if (DB.opts.acol && /helvic/.test(rule || '')) return 'Helvic Wriggle (the option you chose; not on the Acol chart)';
  if (DB.opts.acol && /^(E\.weak-two-answer|GUIDE\.weak-two-after-ask)$/.test(rule || '')) return 'Weak-two features (the option you chose; the Acol chart plays Ogust)';
  return (DB.opts.acol ? REF_ACOL : REF)[id] || '';
};
const REF = {
  A: 'Chart A · Responses to 1NT', B: 'Chart B · Responses to 1♥/♠', C: 'Chart C · Responses to 1♣/♦',
  D: "Chart D · Opener's rebid", E: 'Chart E · 2NT, 2♣, weak twos, pre-empts', F: 'Chart F · Competitive auctions',
  G: 'Chart G · Slam tools', H: 'Chart H · Support doubles, cue bids, Helvic, after a penalty double',
  LTC: 'Chart G · Losing trick count', OB: 'Chart · Opening bids', GUIDE: 'Trainer guide (the chart is silent here)',
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
// An answer: a call, or a number for the LTC counting steps.
const showA = (st, b) => st.kind === 'num' ? String(b) : fmt(b);
const ok = r => !!(r && r.ok);
const countOk = (order, res) => order.filter(j => ok(res[j])).length;

function handHTML(h, showStats, label, ltc) {
  const rows = [3, 2, 1, 0].map(s => `<div class="row"><span class="s ${suitClass(s)}">${SY[s]}</span><span class="cards">${h[s].length ? h[s].map(r => RANK[r] || r).join(' ') : '<span class="void">—</span>'}</span></div>`).join('');
  const stats = showStats ? `<div class="stats"><span>${hcp(h)} HCP</span><span>Shape ${shapeStr(h)} (♠-♥-♦-♣)</span>${ltc ? `<span>${losers(h)} losers</span>` : ''}</div>` : '';
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
  if (q.contract) return `Final contract: ${fmt(q.contract)}${q.cdbl === 'X' ? ' doubled' : q.cdbl === 'XX' ? ' redoubled' : ''}${q.ours === false ? ', played by the opponents' : ''}.`;
  if (!q.partner) return '';   // one-call competitive drill
  if (q.calls.length === 4 && q.calls.every(c => c === 'P')) return 'Nobody opens: the hand is passed out.';
  // The auction stopped early: say why (the chart allows more than one call, or has none).
  return `The drill ends here. ${q.stop ? q.stop.why : 'The chart has no next call.'}`;
}
const outHTML = q => { const o = outcome(q); return o ? `<p class="out">${o}</p>` : ''; };
// For LTC hands: what both hands' real losers say, which neither player could see.
function ltcLine(q) {
  if (!q.ltc || !q.partner || !q.contract || q.ours === false) return '';
  const s = ST.indexOf(q.contract[1]);
  if (s > 3 || q.hand[s].length + q.partner[s].length < 8) return '';
  const a = losers(q.hand), b = losers(q.partner), t = 24 - a - b, need = +q.contract[0] + 6;
  return `<p class="ltcl"><b>Full-deal LTC:</b> you ${a} losers, partner ${b}. 24 − (${a} + ${b}) = ${t} tricks in ${SN[s]}; ${fmt(q.contract)} needs ${need}. ${t === need ? 'The auction found exactly the LTC level.' : `During the auction neither of you could see this: each counted your own losers and the losers the other had <i>shown</i>.`}</p>`;
}
const callsHTML = (title, list) => list.length ? `<div class="pcalls"><span class="eyebrow">${title}</span>${list.map(x => `<p><b>${x.who ? x.who + ' ' : ''}${fmt(x.call)}</b> ${rich(x.why)}</p>`).join('')}</div>` : '';

// ---------- Views ----------
function home() {
  const list = [...sets()].sort((a, b) => (a.last ? 1 : 0) - (b.last ? 1 : 0));
  const cards = list.map(d => {
    const key = keyOf(d.id), done = playedCount(d.id), best = bestOf(key), size = setSize(d);
    const sys = d.helvic ? ` <b>${helvicOn(d) ? 'Playing Helvic Wriggle.' : 'Playing the chart system.'}</b>` : '';
    return `<button class="set" data-set="${d.id}"><div class="set-top"><h3>${rich(d.name)}</h3><span class="chip">${rich(d.refs)}</span></div><p>${rich(d.blurb)}${sys}</p>
    <div class="meter"><i style="width:${done / size * 100}%"></i></div><div class="set-foot"><span>${done ? `${done} / ${size} played` : `${size} hands`}</span><span>${best != null ? `Best ${best}/${size}` : 'Not finished yet'}</span></div></button>`;
  }).join('');
  const ac = DB.opts.acol, hv = DB.opts[optKey(ac, 'helvic')], og = DB.opts[optKey(ac, 'ogust')];
  const seg = (id1, l1, id2, l2, on2, label) => `<div class="seg" role="group" aria-label="${label}"><button id="${id1}" class="${on2 ? '' : 'on'}" aria-pressed="${!on2}">${l1}</button><button id="${id2}" class="${on2 ? 'on' : ''}" aria-pressed="${on2}">${l2}</button></div>`;
  const sysBox = `<div class="sys"><div><span class="eyebrow">System</span><p>${ac ? 'Acol: weak 1NT (12-14), four-card suits, Blackwood. Follows the Acol chart.' : '5-card majors, strong 1NT (15-17), RKCB. Follows the 5CM / strong NT chart.'}</p></div>${seg('m-5cm', '5CM · strong NT', 'm-acol', 'Acol · weak NT', ac, 'Bidding system')}</div>`;
  const helvicBox = `<div class="sys"><div><span class="eyebrow">When our 1NT is doubled</span><p>${hv ? `Helvic Wriggle: pass = values (${ac ? 9 : 7}+) or a wriggle (partner redoubles), XX = weak one-suiter (partner bids 2♣), 2♣/2♦/2♥ = that suit and the next one up.` : ac ? 'Chart: with a 5+ card ♦/♥/♠ suit sign off in it, otherwise pass.' : 'Chart: 2♦/2♥/2♠ natural sign-off (transfers off), redouble with 7+.'}</p></div>
    ${seg('m-chart', 'Chart', 'm-helvic', 'Helvic', hv, 'System when our 1NT is doubled')}</div>`;
  const ogustBox = `<div class="sys"><div><span class="eyebrow">Weak two: the 2NT ask</span><p>${og ? 'Ogust: 3♣ minimum, poor suit · 3♦ minimum, good suit · 3♥ maximum, poor suit · 3♠ maximum, good suit · 3NT AKQ.' : 'Features: 3M minimum or no feature · 3 of a new suit = an outside A or K with a maximum · 3NT AKQ.'}</p></div>
    ${seg('m-feature', 'Features', 'm-ogust', 'Ogust', og, 'Answer to the weak-two 2NT ask')}</div>`;
  app.innerHTML = `<div class="intro"><span class="eyebrow">${ac ? 'Acol · weak NT' : '5-card majors · strong NT'}</span><h1>Bidding drills</h1><p class="muted">You sit South and bid the whole auction. After each call, partner bids on from a real hand by the same chart, and you make your next call. A hand counts as correct only when every call matches the chart. ${ac ? 'In the overcalls drill the opponents have opened or come in.' : 'In the doubling and cue-bid drills all four hands are dealt and the opponents bid too.'}</p>
    <div class="actions" style="margin-top:4px"><button class="ghost" id="newall">New hands for every drill</button></div></div>
    ${sysBox}${helvicBox}${ogustBox}
    <div class="sets">${cards}</div>`;
  app.querySelectorAll('.set').forEach(b => b.onclick = () => start(b.dataset.set));
  const opt = (k, v) => () => { DB.opts[k] = v; save(); render(); };
  const on = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
  on('m-5cm', opt('acol', false)); on('m-acol', opt('acol', true));
  const hk = optKey(ac, 'helvic'), ok = optKey(ac, 'ogust');
  on('m-chart', opt(hk, false)); on('m-helvic', opt(hk, true));
  on('m-feature', opt(ok, false)); on('m-ogust', opt(ok, true));
  document.getElementById('newall').onclick = newHandsEverywhere;
}
// Move every drill (chart and Helvic versions) to its next seed and clear unfinished progress.
// Best scores are kept.
function newHandsEverywhere() {
  ALL_SETS().forEach(d => ['', '~helvic', '~ogust', '~helvic~ogust'].forEach(v => { const k = d.id + v; DB.seed[k] = seedOf(k) + 1; }));
  DB.prog = {};
  save();
  render();
}

// Start or resume a set. With `order` (a list of hand indexes), replay just those hands.
function start(id, order) {
  const qs = getSet(id), key = keyOf(id), seed = seedOf(key), size = qs.length;
  if (!size) throw new Error(`Drill "${id}" dealt no hands.`);
  let pr = progressFor(id);
  if (!pr) { pr = { seed, sig: setSig(qs), res: Array(size).fill(null) }; DB.prog[key] = pr; }
  const ord = order || [...Array(size).keys()];
  const pos = order ? 0 : ord.findIndex(i => !pr.res[i]);
  if (pos < 0) { S = { view: 'done', id, key, qs, order: ord, res: pr.res, retry: false }; return render(); }
  S = { view: 'play', id, key, qs, order: ord, pos, step: 0, cur: [], res: order ? Array(size).fill(null) : pr.res, retry: !!order, practice: false, level: null, answered: null };
  render();
}

function play() {
  const i = S.order[S.pos], q = S.qs[i], d = setDef(S.id), st = q.steps[S.step], last = S.step === q.steps.length - 1, num = st.kind === 'num';
  const nOk = countOk(S.order, S.res);
  // One dot per hand; click a dot to jump to that hand.
  const dots = S.retry ? '' : `<div class="dots" style="grid-template-columns:repeat(${S.qs.length},1fr)">${S.qs.map((_, j) => {
    const r = S.res[j], cls = j === i ? 'cur' : r ? (r.ok ? 'ok' : 'no') : '';
    const label = `Hand ${j + 1}: ${j === i ? 'this hand' : r ? (r.ok ? 'correct; bid it again for practice' : 'missed; bid it again for practice') : 'not played'}`;
    return `<button class="dot ${cls}" data-jump="${j}" title="${label}" aria-label="${label}"${j === i ? ' aria-current="true"' : ''}></button>`;
  }).join('')}</div>`;
  const word = q.steps.some(x => x.kind === 'num') ? 'Step' : 'Call';
  const pips = q.steps.length > 1 ? `<div class="pips">${q.steps.map((_, k) => `<i class="${k < S.step ? (S.cur[k] === q.steps[k].ans.bid ? 'ok' : 'no') : k === S.step ? (S.answered ? (S.answered === st.ans.bid ? 'ok' : 'no') : 'cur') : ''}"></i>`).join('')}<span>${word} ${S.step + 1} of ${q.steps.length}</span></div>` : '';
  const prevWrong = S.step > 0 && q.steps[S.step - 1].kind !== 'num' && S.cur[S.step - 1] !== q.steps[S.step - 1].ans.bid;
  let lower, top = '';   // top: the Continue button, shown above the table so you needn't scroll
  if (S.answered) {
    // Feedback on the answer just given, and on the last step the whole hand.
    const a = st.ans, good = S.answered === a.bid;
    let fin = '';
    if (last) {
      const pc = q.pn.filter(x => !x.auto), oc = (q.on || []).map(x => ({ ...x, who: x.seat === 'W' ? 'LHO' : 'RHO' }));
      fin = `<div class="reveal"><span class="eyebrow">The whole hand</span>${auctionHTML(q.dealer, q.calls)}${outHTML(q)}${ltcLine(q)}
        ${q.partner ? handHTML(q.partner, true, "Partner's hand", q.ltc) : ''}
        ${callsHTML("Partner's calls", pc)}${callsHTML("Opponents' calls", oc)}</div>`;
    }
    const nextLabel = !last ? (num ? 'Next step →' : 'Continue the auction →') : nextUnplayed() < 0 ? 'See results' : 'Next hand →';
    lower = `<div class="fb ${good ? 'ok' : 'no'}" role="status"><div class="verdict">${good ? 'Correct' : num ? `It's ${a.bid}` : `Chart says ${fmt(a.bid)}`}</div>
      ${good ? '' : `<p>You ${num ? 'said' : 'bid'} ${showA(st, S.answered)}.${last || num ? '' : ' The auction continues with the chart call.'}</p>`}<p>${rich(a.why)}</p><span class="ref">${rich(refOf(a.ref, a.id))}</span></div>
      ${fin}`;
    top = `<div class="actions"><button class="primary" id="next">${nextLabel}</button></div>`;
  } else if (num) {
    // The number pad, for counting losers and tricks.
    lower = `<div class="box"><div class="brow np">${st.opts.map(v => `<button class="bc" data-num="${v}">${v}</button>`).join('')}</div><p class="hint">${st.opts[0] === '0' ? 'Losers in your hand' : 'Tricks LTC predicts'}</p></div>`;
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
    ${dots}<div class="lead"><span class="eyebrow">${S.retry ? 'Retrying misses · ' : S.practice ? 'Practice: the first result stands · ' : ''}${rich(d.name)}</span>${pips}<p class="note">${rich(st.note)}${prevWrong ? ' <span class="muted">(The auction went on with the chart call.)</span>' : ''}</p></div>
    ${top}${auctionHTML(q.dealer, st.calls, num ? '?' : S.answered || '?')}${handHTML(q.hand, !!S.answered, '', q.ltc && !!S.answered)}${lower}`;
  document.getElementById('back').onclick = goHome;
  app.querySelectorAll('[data-jump]').forEach(b => b.onclick = () => jumpTo(+b.dataset.jump));
  app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { S.level = +b.dataset.lv; render(); });
  app.querySelectorAll('[data-st]').forEach(b => b.onclick = () => answer(S.level + ST[+b.dataset.st]));
  app.querySelectorAll('[data-call]').forEach(b => b.onclick = () => answer(b.dataset.call));
  app.querySelectorAll('[data-num]').forEach(b => b.onclick = () => answer(b.dataset.num));
  const nx = document.getElementById('next');
  if (nx) { nx.onclick = next; nx.focus({ preventScroll: true }); }
}

function answer(b) {
  const i = S.order[S.pos], q = S.qs[i];
  S.answered = b;
  S.cur[S.step] = b;
  // Only a hand's first attempt is scored. Bidding a played hand again (from the dots) is
  // practice: you see the feedback, but the first result stands, so the score and best
  // score cannot be raised after seeing the answers.
  if (S.step === q.steps.length - 1 && !S.practice) {
    const n = q.steps.filter((st, k) => S.cur[k] === st.ans.bid).length;
    S.res[i] = { bids: S.cur.slice(), n, ok: n === q.steps.length };
    if (!S.retry) {
      // Record the best score as soon as the last hand is answered, even if the
      // user leaves before pressing "See results".
      if (S.res.every(Boolean)) DB.best[S.key] = Math.max(bestOf(S.key) || 0, countOk(S.order, S.res));
      save();
    }
  }
  render();
}

// Position (in S.order) of the next unplayed hand after the current one, wrapping round; -1 if none.
function nextUnplayed() {
  for (let k = 1; k <= S.order.length; k++) {
    const pos = (S.pos + k) % S.order.length;
    if (!S.res[S.order[pos]]) return pos;
  }
  return -1;
}

function next() {
  const q = S.qs[S.order[S.pos]];
  S.answered = null;
  S.level = null;
  if (S.step < q.steps.length - 1) { S.step++; render(); return; }
  S.step = 0;
  S.cur = [];
  S.practice = false;
  const pos = nextUnplayed();
  if (pos >= 0) S.pos = pos;
  else S.view = 'done';
  render();
  window.scrollTo({ top: 0 });
}

// Jump to hand j of the set (from the dots). A hand already played can be bid again for
// practice; its first result stands.
function jumpTo(j) {
  const pos = S.order.indexOf(j);
  if (pos < 0) return;
  Object.assign(S, { pos, step: 0, cur: [], answered: null, level: null, practice: !!S.res[j] });
  render();
}

function done() {
  const d = setDef(S.id), size = S.qs.length, sc = countOk(S.order, S.res), miss = S.order.filter(j => !ok(S.res[j]));
  let calls = 0, callsOk = 0;
  S.order.forEach(j => { calls += S.qs[j].steps.length; if (S.res[j]) callsOk += S.res[j].n; });
  const rows = S.order.map(j => {
    const q = S.qs[j], r = S.res[j], good = ok(r);
    const stepRows = q.steps.map((st, k) => {
      const yb = r && r.bids[k], g = yb === st.ans.bid, lbl = st.kind === 'num' ? (st.opts[0] === '0' ? 'Losers: ' : 'Tricks: ') : '';
      return `<div class="srow"><span class="mk ${g ? 'ok' : 'no'}">${g ? '✓' : '✗'}</span><div><b>${lbl}${showA(st, st.ans.bid)}</b>${g ? '' : ` <span class="muted">(you: ${yb ? showA(st, yb) : '—'})</span>`} ${rich(st.ans.why)}</div></div>`;
    }).join('');
    return `<details><summary><span class="mk ${good ? 'ok' : 'no'}">${good ? '✓' : '✗'}</span><span class="sm">${rich(q.steps[0].note)}</span><span class="cmp">${r ? r.n : 0}/${q.steps.length}</span></summary>
    <div class="det">${auctionHTML(q.dealer, q.calls)}${outHTML(q)}${ltcLine(q)}<div class="pair">${handHTML(q.hand, true, 'Your hand', q.ltc)}${q.partner ? handHTML(q.partner, true, "Partner's hand", q.ltc) : ''}</div>${stepRows}</div></details>`;
  }).join('');
  app.innerHTML = `<div class="bar"><button class="back" id="back">‹ All drills</button><span class="count">${S.retry ? 'Retry' : `Best ${bestOf(S.key) ?? sc}/${size}`}</span></div>
    <div class="intro"><span class="eyebrow">${rich(d.name)}</span><div class="score">${sc}<span class="muted" style="font-size:24px"> / ${S.order.length} hands</span></div>
    <p class="muted">${callsOk} of ${calls} answers matched the chart. ${miss.length ? `${miss.length} hands to review. Tap one to see both hands and every call.` : 'Every hand was bid perfectly.'}</p></div>
    <div class="actions">${miss.length ? '<button class="primary" id="retry">Retry the hands I missed</button>' : ''}<button class="ghost" id="fresh">Deal ${size} new hands</button></div>
    <div class="review">${rows}</div>`;
  document.getElementById('back').onclick = goHome;
  const rt = document.getElementById('retry');
  if (rt) rt.onclick = () => start(S.id, miss);
  document.getElementById('fresh').onclick = () => { DB.seed[S.key] = seedOf(S.key) + 1; delete DB.prog[S.key]; save(); start(S.id); };
}

function goHome() { S = { view: 'home' }; render(); }

// If anything goes wrong, show a way out instead of a blank page.
function crashed(e) {
  console.error(e);
  app.innerHTML = `<div class="intro"><h1>Something went wrong</h1><p class="muted">The trainer hit an error. Going back to the drills usually fixes it. If it keeps happening, resetting saved progress clears any damaged data (this also clears your best scores).</p></div>
    <div class="actions"><button class="primary" id="home">Back to the drills</button><button class="ghost" id="reset">Reset saved progress</button></div>
    <p class="muted"><small>${String(e && e.message || e).replace(/[<&]/g, c => c === '<' ? '&lt;' : '&amp;')}</small></p>`;
  document.getElementById('home').onclick = goHome;
  document.getElementById('reset').onclick = () => { DB = { seed: {}, best: {}, prog: {}, opts: { helvic: false, acol: DB.opts.acol, ogust: false, acolHelvic: false, acolOgust: true } }; save(); goHome(); };
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
