# Builds the 2/1 game forcing chart (an option on the 5CM / strong NT system) as HTML.
# Render with: python3 render_2over1.py  (writes 2over1_Flowchart_A3.pdf)
import re, sys
H = lambda s: re.sub(r'([♥♦])', r'<span class="r">\1</span>', s)

def box(cls, html):
    return f'<div class="b {cls}">{H(html)}</div>'
def panel(x0, y0, x1, y1, cls, letter, title, body, pad=5):
    let = f'<span class="let">{letter}</span>' if letter else ''
    return (f'<div class="panel {cls}" style="left:{x0}pt;top:{y0}pt;width:{x1-x0}pt;height:{y1-y0}pt">'
            f'<div class="ph">{let}<span>{H(title)}</span></div><div class="pb" style="padding:{pad}pt">{body}</div></div>')
arrow = '<div class="arr">▼</div>'
lab = lambda t: f'<div class="lab">{H(t)}</div>'
def auction(rows, note):
    cells = ''.join(f'<td>{H(c)}</td>' for r in rows for c in r)
    trs = ''.join('<tr>' + ''.join(f'<td>{H(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table class="auc"><tr><th>Opener</th><th>Responder</th></tr>{trs}</table><div class="exn">{H(note)}</div>'

# ---------------- A: WHAT CHANGES ----------------
A = f'''{box('note','<b>2/1 game forcing</b> is an option on the strong NT chart. <b>Everything else stays</b>: openings, 1NT and its responses, raises with 4+ trumps (Bergen 3♣/3♦, Jacoby 2NT, splinters), RKCB and control bids.')}
{box('cnv','<b>Only two things change:</b><br>① Over 1♥/1♠, <b>1NT is forcing</b> for one round (6-12, fewer than 3 trumps).<br>② A <b>new suit at the 2-level</b> (1♥–2♣/2♦, 1♠–2♣/2♦/2♥, and 1♦–2♣) is <b>game forcing, 13+</b>.')}
{box('note','<b>Why play it?</b> Once a 2-over-1 has set up game, neither of you has to jump to show strength. You can bid slowly and naturally, find the right game, and look for slam with plenty of room.')}'''

# ---------------- B: RESPONDING ----------------
B = f'''{box('obk','Partner opens <b>1♥</b> or <b>1♠</b>')}
{arrow}
<div class="g3">
<div>{lab('4+ trumps')}{box('rsp','<b>As the chart:</b> 2M up to 6 · 3♦ 7-9 · 3♣ 10-12 · 2NT Jacoby 13+ · splinter · 4M weak.')}</div>
<div>{lab('3 trumps')}{box('rsp','2M 6-9 · 3M 10-12 · 3NT 13-15 balanced · 13+: <b>2-over-1 first</b>, then support.')}</div>
<div>{lab('0-2 trumps')}{box('rsp','1♠ over 1♥ with 4+ ♠ (6+) · <b>6-12: 1NT forcing</b> · <b>13+ (or 10-12 with ≤5 losers): new suit at the 2-level (GF)</b>.')}</div>
</div>
{box('note','With 6-12 (6 losers or more) and a long suit, bid <b>1NT first</b> and show the suit next (to play with 6-9, a jump with 10-12). A 2-level new suit would promise game.')}'''

# ---------------- C: 1M – 1NT FORCING ----------------
C = f'''{box('obk','1M – <b>1NT forcing</b> (6-12)')}
{arrow}
{box('reb','<b>Opener must not pass:</b><br>• 6-card major: <b>2M</b> (11-15) · <b>3M</b> (16-18)<br>• a second 4+ suit below your major: <b>bid it</b> (2♣, 2♦, or 2♥ after 1♠)<br>• reverse (2♠ after 1♥): 16+<br>• 19+: jump shift with a second suit, else 4M with six<br>• balanced 18-19: <b>2NT</b> · 20+: <b>3NT</b><br>• nothing else: <b>your longer minor</b>, even with only three (3-3: 2♣)')}
{arrow}
{box('rsp','<b>Responder, 6-9:</b> pass a minor with 5+ (4+ of 2♥) · <b>2M with two</b> (his minor may be three) · own six-card suit at the 2-level, to play.<br><b>Responder, 10-12</b> (invitational): raise his new suit to 3 · 3 of your own six-card suit · else <b>2NT</b>.<br><b>After 2M:</b> 11-12 with two trumps: 3M, else pass. <b>After 3M:</b> 8+ game. <b>After 2NT:</b> 7+ 3NT.')}
{arrow}
{box('reb','<b>Opener after an invitation:</b> 14+ accept (4M with a major fit, else 3NT) · or 4M with ≤6 losers · else pass.')}'''

# ---------------- D: AFTER A 2-OVER-1 ----------------
D = f'''{box('obk','1M – <b>2x</b> (13+, <b>game forcing</b>)')}
{arrow}
{box('reb','<b>Opener bids naturally</b> (game is forced):<br>• 11-14: raise responder’s minor with 4 (2♥ with 3) · rebid a 6-card major · a new suit below the barrier · 2NT balanced<br>• 15-19: show your shape (a second suit, or a raise) — <b>no need to jump</b><br>• 18-19 balanced: 3NT')}
{arrow}
{box('rsp','<b>Responder places the game:</b> 4M with 3-card support (2 opposite a rebid six-card major) · <b>with extras, go slow</b>: 3 of your six-card major (16+ or ≤5 losers) = slam interest, 4M = minimum · 3NT only with the unbid suits stopped and no void · else a second 5+ suit at the 3-level, or with a minor fit a stopper bid (opener: 3NT or 5m).<br><b>Slam:</b> 31+, or a fit and the losers say 12 tricks → RKCB (no void) or control bids (chart G).')}'''

E = f'''{box('obk','Partner opens <b>1♦</b>')}
{arrow}
{box('rsp','<b>2♣ = 13+, game forcing</b> (5+ clubs). With less and no major: 1NT (6-10, also an unbalanced 11-12), 2NT (11-12 balanced), 3NT (13-15 balanced) as the chart. A 4-card major is still bid at the 1-level first.')}
{box('reb','Opener then bids naturally, as after any 2-over-1 (panel 4).')}'''

# ---------------- F: EXAMPLES ----------------
F = f'''{lab('① 1NT forcing, then opener’s three-card minor')}
{box('note','Responder ♠52 ♥K84 ♦Q976 ♣K652 (8). Opener ♠AQJ84 ♥A62 ♦K4 ♣J73 (14).')}
{auction([['1♠','1NT'],['2♣','2♠'],['Pass','']], 'Opener can’t pass 1NT and has no second suit, so he bids his longer minor, 2♣, with only three. Responder prefers the known five-card suit with two: 2♠.')}
{lab('② 1NT first, then the long suit')}
{box('note','Responder ♠7 ♥Q4 ♦KJ9853 ♣Q962 (8). Opener ♠KQ1063 ♥AJ5 ♦7 ♣AK84 (17).')}
{auction([['1♠','1NT'],['2♣','2♦'],['Pass','']], 'With 8 HCP responder can’t bid 2♦ at once: that would force to game. 1NT first, then 2♦ shows six diamonds and a weak hand, to play.')}
{lab('③ The 2-over-1: game is already forced')}
{box('note','Responder ♠K3 ♥A84 ♦AQ1075 ♣Q92 (15). Opener ♠AJ9752 ♥K6 ♦K4 ♣J83 (12).')}
{auction([['1♠','2♦'],['2♠','4♠']], 'Opener’s 2♠ just shows six spades: no need to jump, game is already forced, and nobody jumps to game on the losers. Responder has two spades and 15: 4♠. With more, either of you could now look for slam slowly.')}
{lab('④ 1♦ – 2♣: game forcing over a minor too')}
{box('note','Responder ♠K10 ♥Q4 ♦AJ9 ♣AJ8752 (15). Opener ♠4 ♥KJ8 ♦Q8652 ♣KQ96 (11).')}
{auction([['1♦','2♣'],['3♣','3NT']], 'Responder’s 2♣ promises game, so opener simply raises clubs with four. No major fit, and responder has something in both majors: 3NT, nine tricks rather than eleven.')}'''

html = f'''<!doctype html><html><head><meta charset="utf-8"><title>2/1 Game Forcing - Flowchart</title><style>
@page {{ size: 1190.55pt 841.89pt; margin:0 }}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0}}
body{{width:1190.55pt;height:841.89pt;position:relative;font-family:"DejaVu Sans",sans-serif;font-size:11.2pt;line-height:1.3;color:#1b1b1b;background:#fff;overflow:hidden}}
.r{{color:#d0021b}} .ph .r{{color:#ffb3bd}} .obk .r{{color:#ff8a99}}
.top{{position:absolute;left:0;top:0;width:100%;height:52pt;background:#12233D;color:#fff;padding:7pt 16pt}}
.top h1{{margin:0;font-size:19pt;font-weight:700;letter-spacing:.2pt}}
.top p{{margin:3pt 0 0;font-size:8.5pt}}
.top .ver{{position:absolute;right:16pt;top:10pt;font-size:8pt;background:#f3d98b;color:#12233D;font-weight:700;padding:2pt 6pt;border-radius:3pt}}
.panel{{position:absolute;border:1.2pt solid var(--c);border-radius:5pt;background:#fff;overflow:hidden}}
.ph{{white-space:nowrap;background:var(--c);color:#fff;font-weight:700;font-size:11pt;height:21pt;padding:2.5pt 6pt;display:flex;align-items:center;gap:5pt}}
.let{{flex-shrink:0;display:inline-flex;width:13pt;height:13pt;border-radius:50%;background:#fff;color:var(--c);align-items:center;justify-content:center;font-size:8.5pt}}
.pb{{display:flex;flex-direction:column;gap:5pt}}
.pA{{--c:#1F3B5E}} .pB{{--c:#2E5E9E}} .pC{{--c:#408A54}} .pD{{--c:#B07A0F}} .pE{{--c:#2E5E9E}} .pF{{--c:#6B4A99}}
.b{{border:0.8pt solid;border-radius:3pt;padding:5pt 6pt}}
.rsp{{background:#E6F0FA;border-color:#4A7BC0}} .reb{{background:#E6F5EB;border-color:#4FA066}} .cnv{{background:#FFF2D6;border-color:#D19A2A}}
.note{{background:#F2F2F2;border-color:#9A9A9A}} .obk{{background:#1F3B5E;color:#fff;border-color:#1F3B5E;font-size:11.5pt}}
.lab{{font-style:italic;color:#555;font-size:10pt;margin:2pt 0 -2pt}}
.arr{{text-align:center;color:#555;font-size:9pt;line-height:9pt;height:9pt}}
.g3{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4pt}} .g3>div{{display:flex;flex-direction:column;gap:3pt}}
.auc{{border-collapse:collapse;margin:0 auto;font-size:11pt}} .auc th{{font-weight:700;padding:1pt 10pt;border-bottom:.8pt solid #999}} .auc td{{text-align:center;padding:1pt 10pt}}
.exn{{font-size:10.2pt;color:#333}}
.legend{{position:absolute;left:16pt;bottom:8pt;font-size:7.5pt;color:#444}} .lg{{margin-right:12pt}} .lg .rsp{{background:#E6F0FA}} .lg .reb{{background:#E6F5EB}} .lg .cnv{{background:#FFF2D6}} .lg .note{{background:#F2F2F2}} .lg .obk{{background:#1F3B5E}} .sw{{display:inline-block;width:9pt;height:9pt;border:.8pt solid;border-radius:2pt;vertical-align:-1pt;margin-right:3pt}}
.foot{{position:absolute;right:16pt;bottom:8pt;font-size:7.5pt;color:#444}}
</style></head><body>
<div class="top"><h1>2/1 GAME FORCING · AN OPTION ON THE 5-CARD MAJOR, STRONG NT SYSTEM</h1>
<p>Over 1♥/1♠: 1NT is forcing (6-12) and a new suit at the 2-level forces to game (13+). Over 1♦, 2♣ is game forcing too. Everything not shown here is as on the strong NT chart. Points are HCP.</p><span class="ver">Option · {sys.argv[2] if len(sys.argv) > 2 else ''}</span></div>
{panel(16,62,390,324,'pA','1','WHAT 2/1 CHANGES',A)}
{panel(16,330,390,598,'pB','2','RESPONDING TO 1♥/1♠',B)}
{panel(16,604,390,800,'pE','5','OVER 1♦: 2♣ IS GAME FORCING',E)}
{panel(398,62,782,474,'pC','3','1M – 1NT FORCING',C)}
{panel(398,480,782,800,'pD','4','AFTER A 2-OVER-1 (GAME FORCING)',D)}
{panel(790,62,1175,800,'pF','6','EXAMPLES',F)}
<div class="legend">{''.join(f'<span class="lg"><i class="sw {c}"></i>{t}</span>' for c, t in [('obk','Auction so far'),('rsp','Responder'),('reb','Opener'),('cnv','Convention'),('note','Note')])}</div>
<div class="foot">Print on A3, or scale to fit A4. Arrows show the order of the auction.</div>
</body></html>'''
open(sys.argv[1], 'w').write(html)
