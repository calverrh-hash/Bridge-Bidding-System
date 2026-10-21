// A tiny test harness: test(name, fn), check(condition, message), same(actual, expected, message),
// and info(name, text) for a line of information that is not a test.
// Results are written to the page; the page title becomes "PASS n" or "FAIL n" for run.sh.
'use strict';

const RESULTS = [];
function test(name, fn) {
  try { fn(); RESULTS.push({ name, ok: true }); }
  catch (e) { RESULTS.push({ name, ok: false, msg: e && e.message || String(e) }); }
}
function info(name, text) { RESULTS.push({ name, ok: true, info: text }); }
function check(cond, msg) { if (!cond) throw new Error(msg || 'check failed'); }
function same(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}expected ${b}, got ${a}`);
}

// Hands in bridge order, spades first: parseHand('AKQ2.K53.Q72.J4'). '-' is a void, T or 10 is the ten.
function parseHand(str) {
  const val = { A: 14, K: 13, Q: 12, J: 11, T: 10 };
  const parts = str.split('.');
  if (parts.length !== 4) throw new Error('hand needs 4 suits: ' + str);
  const h = parts.reverse().map(p => p === '-' ? [] : p.replace(/10/g, 'T').split('').map(c => val[c] || +c).sort((a, b) => b - a));
  const n = h.flat().length;
  if (n !== 13) throw new Error(`hand has ${n} cards: ${str}`);
  return h;
}
// The chart call for hand `str` after the partnership calls `seq` (space separated).
const callFor = (seq, str) => { const c = sysCall(seq ? seq.split(' ') : [], parseHand(str)); return isCall(c) ? c.bid : null; };

function report() {
  const tests = RESULTS.filter(r => !r.info), failed = tests.filter(r => !r.ok);
  const lines = RESULTS.map(r => r.info ? `info ${r.name}\n       ${r.info}` : (r.ok ? 'ok   ' : 'FAIL ') + r.name + (r.ok ? '' : '\n       ' + r.msg));
  lines.push('', `${tests.length - failed.length} passed, ${failed.length} failed`);
  const o = document.getElementById('o');
  o.textContent = lines.join('\n');
  o.className = failed.length ? 'fail' : 'pass';
  document.title = failed.length ? `FAIL ${failed.length}` : `PASS ${tests.length}`;
}
window.addEventListener('error', e => RESULTS.push({ name: 'uncaught error while loading', ok: false, msg: e.message + ' at ' + e.filename + ':' + e.lineno }));
