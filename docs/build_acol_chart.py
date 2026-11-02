# Builds the Acol / weak NT A3 chart as HTML (rendered to PDF by render_acol.py).
# It shares its look with build_chart.py (the 5CM chart): the style block is read from there.
import re, sys, os
H = lambda s: re.sub(r'([♥♦])', r'<span class="r">\1</span>', s)
def box(cls, html): return f'<div class="b {cls}">{H(html)}</div>'
def panel(x0, y0, x1, y1, cls, letter, title, body, pad=5):
    let = f'<span class="let">{letter}</span>' if letter else ''
    return (f'<div class="panel {cls}" style="left:{x0}pt;top:{y0}pt;width:{x1-x0}pt;height:{y1-y0}pt">'
            f'<div class="ph">{let}<span>{H(title)}</span></div><div class="pb" style="padding:{pad}pt">{body}</div></div>')
arrow = '<div class="arr">▼</div>'
lab = lambda t: f'<div class="lab">{t}</div>'

op = ''.join(f'<div class="ob">{H(t)}</div>' for t in [
 '<b>1NT</b> 12-14 balanced → <b>A</b>',
 '<b>1♣/♦/♥/♠</b> longest suit. Equal 4-4: ♥ > ♠ > ♦ > ♣ · <b>5-5: the higher-ranking</b>. Balanced 15-19 → <b>C</b> · unbalanced 13-22, or 11-12 when HCP + two longest suits ≥ 20 → <b>B, D</b>',
 '<b>2NT</b> 20-22 balanced → <b>E</b>',
 '<b>2♣</b> 23+ any shape, game forcing → <b>E</b>',
 '<b>2♦/♥/♠</b> weak two: 5-10 HCP, 6-card suit → <b>E</b>',
 '<b>3-level / 4-level</b> pre-empts: 7-card / 8-card suit, 0-9 HCP → <b>H</b>',
 '<b>Opponents bid</b> (overcall or double) → <b>F, H</b>',
 '<b>Slam</b>: 4NT once a suit is agreed, loser count → <b>G</b>'])

A = f'''
{lab('BALANCED, no 5-card major (and no 4-card major with 11+)')}
<div class="g5">
 <div>{box('rsp','<b>0-10</b><br>Pass')}</div>
 <div>{box('rsp','<b>11</b><br>2♠ McKendrick')}</div>
 <div>{box('rsp','<b>12</b><br>2NT invite')}</div>
 <div>{box('rsp','<b>13-18</b><br>3NT')}</div>
 <div>{box('rsp','<b>19-20</b> 4NT quant.<br><b>21+</b> 6NT')}</div>
</div>
<div class="g5 mt">
 <div class="span2">{arrow}{box('reb','<b>2♠ = 11-pt range-ask, or a weak long minor (0-10, 6+ cards).</b> Opener 2NT = 12-13: 11 pass · weak hand 3♣/3♦ to play. Opener 3♣ = 14: 11 bids 3NT · weak clubs pass · weak diamonds 3♦.')}</div>
 <div>{arrow}{box('reb','Opener: 12 pass · 13-14 3NT')}</div>
 <div></div>
 <div>{arrow}{box('reb','Opener: 14 → 6NT, else pass')}</div>
</div>
{lab('A 5-card major, or a 4-card major with 11+')}
<div class="g2">
 <div>{box('cnv','<b>2♦ → 2♥ · 2♥ → 2♠ TRANSFERS</b>: 5+ major, any strength (5-5: spades). Opener always completes.')}
  {arrow}{box('reb','<b>Then:</b> 0-10 pass · <b>11</b>: five → 2NT (opener: with 3 trumps 12 → 3M, 13-14 → 4M; with 2, 12 pass, 13-14 3NT) · six → 3M (13-14 → 4M) · <b>12+ or ≤6 losers</b>: five → 3NT (opener 4M with 3) · six → 4M.')}</div>
 <div>{box('cnv','<b>2♣ STAYMAN</b>: 11+ with a 4-card major, or weak 5-4 majors (0-10). Opener: <b>2♦</b> no major · <b>2♥</b> 4♥ (may hold 4♠) · <b>2♠</b> 4♠, ≤3♥.')}
  {arrow}{box('reb','<b>Fit:</b> 11-12 3M invite (13-14 accept) · 13+ or ≤6 losers 4M. <b>No fit:</b> 11-12 2NT · 13+ 3NT. After 2♥ with 4♠: 2NT / 3NT (opener with 4♠: 3♠/4♠ over 2NT, 4♠ over 3NT). <b>Weak 5-4:</b> pass a fit; over 2♦ the 5-card major to play (≤6 losers: 3M forcing / 4M).')}</div>
</div>
{box('note','<b>Long minors:</b> 6+ and 0-10 → 2♠ then 3♣/3♦ · 12-15 → 3NT · 16+ → 5m. <b>Shape:</b> opposite 12-14 (about 8 losers) a long major with ≤6 losers is worth game. <b>Natural option</b> (switch in the trainer): 2♦/2♥ to play, weak spades via Stayman, 3M = five 12+, 4M = six.')}'''

B = f'''
{lab('4+ card support for a major')}
{box('rsp','<b>2M</b> 6-9 · <b>3M</b> 10-12 · <b>4M</b> shape raise (7 losers, under 13 HCP) · <b>2NT JACOBY</b> 13+, or 10+ with ≤6 losers (game forcing). <b>Losers</b> (with a singleton, void or 5 trumps): 9 → 2M · 8 → 3M · 7 → 4M. 0-5 with ≤9 losers: 2M. <i>Natural option: 2NT 10-12, 4M 13-15, 16+ new suit then support.</i>')}
<div class="g3">{arrow}{arrow}{arrow}</div>
<div class="g3">{box('reb','<b>After 2M:</b> 19+ or ≤5 losers 4M · 16-18 or 6 losers 3M try (responder 8-9 or ≤8 losers → 4M) · else pass. 4NT if losers say 12 tricks (G).')}{box('reb','<b>After 3M:</b> 14+ or ≤6 losers 4M, else pass. <b>After 4M:</b> slam check (G).')}{box('cnv','<b>After Jacoby:</b> short suit → 3 of it · else 4M 13-14 · 3NT 15-17 · 3M 18+. Responder: 4M, or 4NT when slam is there (G).')}</div>
{lab('Other responses')}
{box('rsp','<b>New suit</b>: longest; 4-4 the lower (4-4 majors: ♥), <b>5-5 the higher</b>. 1-level 6+ (fewer with shape: 4-5 with ≤9 losers, or a 5+ suit with ≤7 losers) · 2-level 9+ (with less, 1NT: it keeps the auction low). 6-5 with a longer minor: the minor first. Forcing. <b>Never skip a 4-card major</b> over 1♣/♦ (unless a longer minor and 10+); over 1♠ with 4♥ and 10+: 2♥.')}
{box('rsp','<b>Minor raise</b> (4+, no 4-card major): 2m 6-9 · 3m 10-12. <b>1NT</b> 6-9 · <b>2NT</b> 10-12 bal (over 1♥/♠: a new suit, then 2NT) · <b>3NT</b> 13-15 bal.')}
{arrow}
{box('reb','<b>Opener:</b> after 2m: 16-18 no short suit 2NT (8-9 → 3NT) · 19 3NT · short suit 3m try (8-9 → 3NT). After 3m: 14+ 3NT · <b>short suit</b> + 14+ or ≤6 losers: show a stopper, 3x (responder 3NT with the other suits stopped, else 4m; opener 5m with ≤5 losers). <b>After 2NT (over 1m):</b> six in a major 4M · 2nd 5-card suit 3x (forcing) · five in a major + 14 3M (3 → 4M) · 14+ 3NT · 13: pass (6-card minor 3m). <b>After 3NT:</b> six-card major, unbalanced: 4M.')}'''

C = f'''
{box('reb','<b>Balanced 15-19</b> opens a suit and rebids no-trumps (with 4 of partner’s major, raise it instead).')}
<div class="g2">{box('reb','<b>After a 1-level reply:</b> 15-16 1NT · 17-18 2NT · 19 3NT.')}{box('reb','<b>After a 2-level reply:</b> 15-16 2NT · 17-19 3NT.')}</div>
<div class="g2">{arrow}{arrow}</div>
{box('rsp','<b>Responder after 1NT:</b> ≤8 pass · 9 2NT (opener 16 → 3NT) · 10+ game · six in a major: 2M weak, 4M with 9+ or ≤7 losers · <b>five in a major + game values: 3M forcing</b> (opener 4M with 3, else 3NT). <b>After 2NT:</b> 8+ game (five in a major: 3M). <b>After 3NT:</b> pass, 4M with six; 14+ 6NT.')}'''

D = ''.join([
 box('reb','<b>13-14 "weak":</b> raise partner’s suit with 4 · <b>never skip a 4-card major</b> (after a 2-level reply 2♥/2♠ is fine with 13-14) · new suit below the barrier · rebid a 5+ suit. <b>After a 2-level reply a new suit is forcing</b>: don’t jump with 15-18.'),
 box('reb','<b>15-18 "strong":</b> <b>5-5 / 6-5: show the 2nd suit</b>, even as a reverse (also 13-14 with ≤5 losers; ≤4 losers: jump) · double raise · jump rebid of a 6+ suit · reverse with a 4-card suit.'),
 box('reb','<b>19-22:</b> jump shift, game forcing (after a 2-level reply a 3-level new suit is enough: never jump past 3NT) · 4 trumps for partner: game.'),
 box('rsp','<b>Responder after a minimum:</b> ≤10 pass or preference · 11-12 invite · 13+ game. <b>After your 2-level reply opener’s new suit forces:</b> raise with 4 · preference with 3 · else rebid 6 / 2NT. <b>No fit:</b> 2NT/3NT only with the unbid suits stopped and no singleton in partner’s suit; otherwise a second 4+ suit at the 3-level, forcing (opener: 3NT with a stopper · rebid six · support · responder then picks the game). <b>Own 6-card suit, no fit:</b> rebid it (11-12 jump; 13+ game). Weak minor over a minor rebid: pass with a doubleton. <b>Unbid 4-card major, 10+:</b> bid it at the 2-level (forcing; opener raises with 4, shows 3 in your 1st major, else 2NT). After a 1NT reply, a 6+ unbid suit: bid it to play.'),
 box('rsp','<b>After a reverse:</b> 10+ game · 6-9: raise the 2nd suit with 4, else preference; opener bids game with 17+ or ≤5 losers (6-5 with ≤4 losers: always). <b>After a jump rebid:</b> 10+ game (31+ with a fit: 4NT) · six in a major (8+): 3M forcing (opener 4M with 2). <b>After a jump shift:</b> never pass: support (slam check, G) · six in a major: 3M · minor fit + short suit: 5m · else 3NT. <b>Opener raises your minor:</b> 12+ 3NT. <b>Double raise:</b> 10+ game.'),
 box('note','Barrier = 2 of the opening suit; a new suit above it is a reverse (15+). With a fit, losers decide game: 24 − (yours + partner’s) ≥ 10 for a major, 11 for a minor (G).')])

E = f'''<div class="g2">{box('cnv','<b>2NT 20-22 bal:</b> 0-3 pass · 4+: 3NT · 3♣ Stayman (opener 3♦/3♥/3♠; then 4M with a fit, else 3NT) · 3♥/3♠ five (opener 4M with 3, else 3NT) · 4♥/4♠ six.')}
{box('cnv','<b>2♣ 23+:</b> 2♦ negative 0-7 · positive 8+: 4+ suit 2♥/♠, 5+ suit 3♣/♦, bal 8-9 2NT, 10-12 3NT. After 2♦: 2♥/♠ five (0-3 2NT; 4+ 4M with 3, else 3NT) · 3♣/♦ (show a 5+ major: opener 4M with 3, else 3NT) · 23-24 2NT · 25+ 3NT.')}</div>
<div class="sp"></div>
{box('cnv','<b>Weak two 2♦/♥/♠</b> (5-10, 6-card suit). Responder: pass (under 14) · 3M with 3 trumps · 4M with 4+ (and with 4+ and 14+: game, no need to ask) · <b>2NT ask 14+</b> · own good 6+ major, ≤2 in partner’s suit, 14+ or ≤5 losers: 4 of your suit · void in partner’s suit: don’t ask. <b>OGUST</b> answers: 3♣ min poor · 3♦ min good · 3♥ max poor · 3♠ max good · 3NT AKQ (good = 2 of the top 3). Then sign off at 3M, or bid game (3NT if a minor). <b>Features option</b> (switch): 3M minimum · outside A/K = maximum.')}'''

F = ''.join([
 box('cmp','<b>Overcalls</b> (their 1-suit opening): 1-level 5+ good suit, 8+ · 2-level 6+ good suit, 10+ · <b>jump 6+ suit, 13-16</b> (strong) · 1NT 16-18 balanced with a stopper.'),
 box('cmp','<b>Takeout double:</b> 12+, 3+ in every unbid suit. Advancer: <b>a 4-card major first</b>, else longest suit · 0-8 cheapest · 9-11 jump · 12+ game. Don’t pass unless opener’s partner bids.'),
 box('cmp','<b>Partner overcalls:</b> raise with 3+ (2+ after a jump overcall): 6-10 one level, 11-12 two, 13+ game · change suit only if yours is longer (6+) · NT only with a good stopper.'),
 box('cmp','<b>Partner opens, RHO overcalls or doubles:</b> bid as you would have done (no negative doubles). The suit you would have bid is theirs: show your other suit, or NT with their suit stopped (6-9 1NT, 10-12 2NT, 13+ 3NT). A 5+ suit with ≤7 losers may bid at the 2-level under 9. Raise by losers as in B.'),
 box('note','Lead partner’s suit when defending.')])

ltc = '''<table class="lt"><tr><th colspan="2">Opener</th></tr><tr><th>Points</th><th>Losers</th></tr>
<tr><td>12-14</td><td>7-8</td></tr><tr><td>15-17</td><td>6</td></tr><tr><td>18-19</td><td>5</td></tr><tr><td>20-22</td><td>4</td></tr><tr><td>23+</td><td>3</td></tr></table>
<table class="lt"><tr><th colspan="2">Responder</th></tr><tr><th>Points</th><th>Losers</th></tr>
<tr><td>0-5</td><td>10</td></tr><tr><td>6-9</td><td>9</td></tr><tr><td>10-11</td><td>8</td></tr><tr><td>12-15</td><td>7</td></tr><tr><td>16+</td><td>6</td></tr></table>'''
G = f'''{box('cnv','<b>RKCB 4NT</b> once a trump suit is agreed (4NT straight over NT is quantitative). Key cards = 4 aces + the K of trumps. Replies: <b>5♣ 0 or 3</b> · <b>5♦ 1 or 4</b> · <b>5♥ 2 without Q</b> · <b>5♠ 2 with Q</b>.')}
{arrow}
{box('cnv','<b>CONTROL BIDS</b> after Jacoby (slam possible, 29+ or LTC 12, but a suit without A/K/shortness, or a void): cheapest <b>ace or void</b> below 4M; skipping a suit denies one. Partner: cheapest ace/void, else 4M. All controlled → 4NT; else 4M.')}
{box('reb','<b>Asker:</b> missing two key cards → 5 of trumps · missing one → 6 · all five and the trump Q → 5NT for kings (partner bids his cheapest side king, or 6 of trumps with none), then 7 with a side king. Trumps = the agreed suit (a new suit then support plays in opener’s suit).')}
{box('cnv','<b>WHEN TO ASK:</b> a fit and 31+ points between you, <b>or</b> the loser count says 12 tricks: 24 − (yours + partner’s) ≥ 12. Use 4NT only when there is room to stop at 5 of the suit.')}
<div class="b cnv"><b>LOSING TRICK COUNT</b> (8+ card fit only, never NT). <b>24 − (opener’s losers + responder’s losers) = tricks</b>: 10 → game in a major, 11 → game in a minor, 12 → slam. Losers overrule points only with real shape (singleton, void, 5+ trumps).<div class="ltw">{ltc}</div></div>'''

Hp = f'''<div class="g2">
<div>{box('cmp','<b>Pre-empts</b> (0-9): 3♣-3♠ 7-card suit · 4♣-4♠ 8-card suit. Partner: change suit only if yours is longer · with 3-4 top honours: 3m → 3NT, 3M → 4M, 4m → 5m.')}
{box('cmp','<b>Over their pre-empt (12+):</b> 6-card suit at the 3-level (equal: the higher; a 6+ major with ≤5 losers: game) · 7-card suit at the 4-level · double = takeout. Partner: longest suit, game with 12+; raise to game with 12+ and 2-card support.')}</div>
<div>{box('cmp','<b>Their 12-14 1NT:</b> double = 16+ penalty · 2-level overcall: 10+ with a good 6+ suit, or 8+ with a 7-card suit (or six with ≤6 losers).')}
{box('cmp','<b>Our 1NT doubled:</b> 5+ suit sign-off 2♦/♥/♠, otherwise pass (opener passes the sign-off).')}
{box('cnv','<b>HELVIC WRIGGLE</b> (option): pass = 9+ values (pass the forced XX) or a wriggle (after opener’s XX bid 4-card suits up the line) · XX = weak one-suiter (opener 2♣, pass or correct) · 2♣/♦/♥ = that suit and the next one up.')}</div>
</div>'''

legend = ''.join(f'<span class="lg"><i class="sw {c}"></i>{t}</span>' for c, t in [('obk','Opening'),('rsp','Response'),('reb','Opener rebid'),('cnv','Convention'),('cmp','Competitive'),('note','Note')])
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build_chart.py')).read()
style = re.search(r'<style>(.*?)</style>', src, re.S).group(1).replace('{{', '{').replace('}}', '}')
style += '.pD .b{font-size:7.1pt;line-height:1.22} .pA .b{font-size:7pt} .pB .b{font-size:6.9pt} .pF .b{font-size:7.6pt;line-height:1.3} .pC .b,.pG .b,.pE .b,.pH .b{font-size:7.4pt;line-height:1.28}'
html = f'''<!doctype html><html><head><meta charset="utf-8"><title>Acol Weak NT - Bidding Flowchart</title><style>{style}</style></head><body>
<div class="top"><h1>ACOL · WEAK NT (12-14)  -  BIDDING FLOWCHART</h1>
<p>Letters A-H link each opening bid to its response flowchart. Points are HCP. Alertable: transfers, McKendrick 2♠, Jacoby 2NT, weak twos, Ogust, 2♣, Helvic.</p><span class="ver">Updated {sys.argv[2] if len(sys.argv) > 2 else ''}</span></div>
{panel(16,60,204,338,'pO','','OPENING BIDS','<div class="pb" style="gap:5pt;padding:0">'+op+'</div>')}
{panel(212,60,689,375,'pA','A','RESPONSES TO 1NT (12-14)',A)}
{panel(697,60,1030,375,'pB','B','RESPONSES TO 1♣/♦/♥/♠',B)}
{panel(1038,60,1175,375,'pC','C',"NT REBIDS (bal 15-19)",C)}
{panel(16,346,204,808,'pD','D',"OPENER'S SUIT REBIDS (13-22)",D)}
{panel(212,383,689,622,'pE','E','2NT · 2♣ · WEAK TWOS (OGUST)',E)}
{panel(212,630,689,808,'pH','H','PRE-EMPTS · THEIR 1NT · OUR 1NT DOUBLED',Hp)}
{panel(697,383,932,808,'pF','F','OVERCALLS AND DOUBLES',F)}
{panel(940,383,1175,808,'pG','G','RKCB · LOSING TRICKS',G)}
<div class="legend">{legend}</div>
<div class="foot">Print on A3, or scale to fit A4. Arrows show the order of the auction.</div>
</body></html>'''
open(sys.argv[1], 'w').write(html)
