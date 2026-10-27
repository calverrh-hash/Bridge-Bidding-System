# Builds the updated A3 chart as HTML, rendered to PDF with Chromium.
import re, sys
H = lambda s: re.sub(r'([♥♦])', r'<span class="r">\1</span>', s)
def box(cls, html, extra=''):
    return f'<div class="b {cls}" {extra}>{H(html)}</div>'
def panel(x0, y0, x1, y1, cls, letter, title, body, pad=5):
    let = f'<span class="let">{letter}</span>' if letter else ''
    return (f'<div class="panel {cls}" style="left:{x0}pt;top:{y0}pt;width:{x1-x0}pt;height:{y1-y0}pt">'
            f'<div class="ph">{let}<span>{H(title)}</span></div><div class="pb" style="padding:{pad}pt">{body}</div></div>')
arrow = '<div class="arr">▼</div>'
lab = lambda t: f'<div class="lab">{t}</div>'

# ---------------- OPENING BIDS ----------------
op = ''.join(f'<div class="ob">{H(t)}</div>' for t in [
 '<b>1NT</b> 15-17 balanced → <b>A</b>',
 '<b>1♥/♠</b> 5+ card major, 11-22 pts. <b>5-5: open the higher-ranking suit</b> (1♠ with both majors) → <b>B, D</b>',
 '<b>1♣/♦</b> no 5-card major (or a longer minor: 6-5 opens the minor, then bid the major twice): balanced 12-14 or 18-19, or unbalanced 11-22. Longer minor; 4-4 or 5-5 minors 1♦; 3-3 minors 1♣ → <b>C, D</b>',
 '<b>2NT</b> 20-22 balanced → <b>E</b>',
 '<b>2♣</b> 23+ any shape, game forcing → <b>E</b>',
 '<b>2♦/♥/♠</b> weak: 5-10 HCP, 6-card suit → <b>E</b>',
 '<b>3-level / 4-level</b> pre-empts: 7-card / 8-card suit, 0-10 HCP → <b>E</b>',
 '<b>Opponents bid</b> (overcall or double) → <b>F, H</b>',
 '<b>Slam try / 4NT</b> → <b>G</b>'])

fixes = '<br>'.join(H(t) for t in [
 '• Stayman is 8+ (slide said 11+).',
 '• 16 pts over 1NT now covered: 15 = minimum, 16-17 = accept. 12 and 13 filled in elsewhere.',
 '• <b>Smolen added</b>; weak 5-4 majors now 0-7 (was 0-10, clashed with invites).',
 '• Jump transfers replaced so opener can accept an invitation.',
 '• 4NT quantitative added over 1NT (slam route).',
 '• One strong band, 15-19; jump shift covers 20-22; 2♣ gets minor-suit and 25-27 rebids.',
 '• NT rebids after 2-level responses: 12-14 / 18-19 (were 12-15 / 16-19).',
 '• Responder no longer capped at 15; 13+ with 3-card support bids a new suit, not 4M.',
 '• 1NT over 1M = 6-10 any shape; 4M = weak raise.',
 '• Jacoby: trump suit never shown as a singleton; 3M = 18+.',
 '• <b>Negative and penalty doubles</b> and redouble added; 1NT overcall unified at 15-18.',
 '• Defence to 1NT (Cappelletti), Michaels / Unusual 2NT and our doubled 1NT overcall are now decided.',
 '• Weak-two ask lowered to 14+. RKCB counts key cards and flags the 5♠ problem. LTC gets an 11 row and a formula.'])
updates = '<br>'.join(H(t) for t in [
 '• <b>5-5: open the higher-ranking suit</b> (was 1♥ with 5-5 majors).',
 '• <b>Slam:</b> fit + 31+ combined → 4NT, with 2+ key cards; read an unclear reply low; grand = all 5 key cards + trump Q + a side king (G). Jacoby 18+: 4NT at once (B).',
 '• <b>Added (H):</b> support double/redouble, unassuming cue bid, Helvic option, opener reopening, bidding on after penalty doubles.',
 '• <b>Takeout double advancer:</b> 4-card major first; 12+ cue-bid; a 5-card major then at the 3-level. After our redouble, pass is forcing (F).',
 '• Over 2NT: transfer then 3NT = choice (E). Over 1♣: 4-card major before 4♦ (C).',
 '• "Positive double" renamed <b>penalty double</b>; the support double is the positive one.'])

# ---------------- A ----------------
A = f'''
{lab('BALANCED hand, no major to show')}
<div class="g5">
 <div class="col">{box('rsp','<b>0-7</b><br>Pass')}</div>
 <div class="col span2">
   <div class="g2">{box('rsp','<b>8</b><br>2♠ range-ask<br>(McKendrick)')}{box('rsp','<b>9</b><br>2NT invite')}</div>
 </div>
 <div class="col">{box('rsp','<b>10-15</b><br>3NT')}</div>
 <div class="col">{box('rsp','<b>16-17</b><br>4NT quantitative<br>18+: slam try')}</div>
</div>
<div class="g5 mt">
 <div class="span2">{arrow}{box('reb','<b>2♠ = 8-pt range-ask, or weak long minor (0-7).</b> Opener 2NT = 15-16: 8 pts pass; weak hand bids 3♣/3♦ to play. Opener 3♣ = 17: 8 pts bid 3NT; weak clubs pass, weak diamonds 3♦.')}</div>
 <div>{arrow}{box('reb','Opener: 15 pass; 16-17 bid 3NT')}</div>
 <div></div>
 <div>{arrow}{box('reb','Opener: 15 pass; 16-17 bid 6NT')}</div>
</div>
{lab('UNBALANCED hand / holding a major')}
<div class="g5">
 <div class="span2">{box('cnv','<b>2♣ STAYMAN</b> - 8+ with a 4-card major (or 5-4 in the majors). Opener: <b>2♦</b> no 4-card major · <b>2♥</b> 4♥ (may hold 4♠) · <b>2♠</b> 4♠ and ≤3♥.')}
   {arrow}{box('reb','<b>After 2♦:</b> 2NT = 8-9 invite (15 pass, 16-17 3NT) · 3NT = 10+ · <b>SMOLEN: 3♥ = 5♠+4♥, 3♠ = 5♥+4♠</b> (game force; opener bids 4 of the 5-card major with 3+ cards, else 3NT) · weak 5-4 (0-7): 2♥/2♠ to play.')}
   <div class="sp"></div>{box('reb','<b>After 2♥/2♠ (fit):</b> 3M invite 8-9 (16-17 → 4M, 15 pass) · 4M 10+. <b>No fit:</b> 2NT 8-9 · 3NT 10+. After 2♥ with 4♠ only: 2♠ = game force (opener 4♠ with four, else 3NT). Weak 5-4: pass the fit.')}</div>
 <div class="span3">
   <div class="g3">
     <div class="span2">{box('cnv','<b>2♦ → 2♥ · 2♥ → 2♠ TRANSFERS</b> - 5+ card major, any strength. Opener completes. (Jump transfers removed: opener could never accept an invitation.)')}
       {arrow}{box('reb','<b>After a completed transfer:</b> pass 0-7 · 2NT = 5-card suit, invite 8-9 (opener: 15 pass, or 3M with 3+; 16-17 3NT, or 4M with 3+) · 3M = 6+ cards, invite 8-9 (16-17 → 4M) · 3NT = 5-card suit, 10-14 (opener passes, or corrects to 4M with 3+) · new suit = slam try (forcing).')}</div>
     <div>{box('cnv','<b>4♦ → 4♥ · 4♥ → 4♠ TEXAS</b> - 6+ major, 10+, to play.')}<div class="sp"></div>{box('note','Invites: 15 = minimum, 16-17 = accept.')}</div>
   </div>
   <div class="sp"></div>{box('note','<b>Slam:</b> 4NT quantitative (balanced) · transfer then new suit · once a fit is found 4NT = RKCB with 31+ combined (see G).')}
 </div>
</div>'''

# ---------------- B ----------------
B = f'''
{lab('3 trumps')}
{box('rsp','<b>3 trumps:</b> 2M 6-9 (4-5 with ≤9 losers = 6) · 3M 10-12 · 13+: new suit, then support. <b>4M = weak, 5+ trumps</b>.')}
<div class="g2">{arrow}{arrow}</div>
<div class="g2">{box('reb','<b>After 2M:</b> 11-15 pass · 16-18 3M try (8-9 or ≤8 losers → 4M, else pass) · 19+ 4M · <b>by losers: 6 → 3M, ≤5 → 4M</b>.')}{box('reb','<b>After 3M:</b> 15+ 4M (31+ combined → 4NT, G) · 13-14 use LTC · 11-12 pass (≤6 losers: 4M).')}</div>
{lab('4+ trumps')}
{box('rsp','<b>4+ trumps: 3♦ = 7-9</b> · <b>3♣ = 10-12</b> · <b>2NT Jacoby = 13+ or ≤7 losers</b> (GF); good 5+ side suit: bid it first.')}
<div class="g2">{arrow}{arrow}</div>
<div class="g2">{box('reb','<b>After 3♦:</b> 11-15 sign off 3M · 16+ 4M.')}{box('reb','<b>After 3♣:</b> 11-13 sign off 3M · 14+ 4M.')}</div>
<div class="sp"></div>
{box('cnv','<b>JACOBY 2NT - opener bids:</b> 4 new suit = good 5-card side suit · else 3 of a singleton/void · 3NT 15-17 flat · 4M 11-14 flat · <b>18+ with 2+ key cards: 4NT at once</b> (31+ combined), else 3M 18+ flat.')}
{lab('0-2 trumps')}
{box('rsp','<b>0-2 trumps:</b> over 1♥: 1♠ with 4+♠ (6+, forcing) · <b>1NT 6-10, any shape, not forcing</b> · new suit at 2-level 9+ (forcing). Opener rebids: see D.')}'''

# ---------------- C ----------------
C = f'''
{box('rsp','<b>New suit - longest (if equal, lowest; over 1♣ with 4♦ and a 4-card major, bid the major):</b> 1-level 6+ pts (or 4-5 with ≤9 losers) · 2-level 9+ pts. Forcing, <b>no upper limit</b>: a 16+ hand starts here and makes slam tries.')}
<div class="sp"></div>
<div class="g2">{box('rsp','<b>1NT</b> 6-10 balanced, no 4-card major.')}{box('rsp','<b>2NT</b> 11-12 balanced, no major.')}</div>
<div class="g2">{arrow}{arrow}</div>
<div class="g2">{box('reb','Opener: balanced pass (18-19 2NT, 20+ 3NT) · 6-card minor 2m (15-19 3m) · other minor 2x.')}{box('reb','Opener: 13+ 3NT · minimum: 6-card minor 3m, else pass.')}</div>
<div class="sp"></div>
{box('reb','After 18-19 2NT: 6-7 pass · 8-10 3NT. After a 15-19 jump or support: 8-10 bid game.')}
<div class="sp"></div>
{box('rsp','<b>Opener raised your minor:</b> to 2: 11-12 2NT, 13+ 3NT · to 3: 12+ 3NT (4M with 3 of opener\'s major) · jump raise: 10+ 3NT.')}
<div class="sp"></div>
{box('rsp','<b>3NT</b> = 13-15 balanced, no major. With 16+ balanced: new suit first, then 4NT quantitative.')}'''

# ---------------- D ----------------
D = ''.join([
 box('reb','<b>Balanced:</b> 12-14 → 1NT (2NT after a 2-level response) · 18-19 → 2NT (3NT after a 2-level response).'),
 box('reb','<b>Unbalanced 11-14 "weak":</b> simple raise (4+) 1♣-1♥-2♥ · new suit below the barrier 1♣-1♥-1♠ (<b>6-4: major first</b>) · simple rebid of a 5+ suit 1♠-2♥-2♠.'),
 box('reb','<b>Unbalanced 15-19 "strong"</b> (or 7-card suit / ≤5 losers)<b>:</b> double raise 1♣-1♥-3♥ · reverse (above the barrier) 1♦-1♠-2♥ · jump rebid of a 6+ suit 1♠-2♥-3♠ · 6-5 (minor opened): show the major.'),
 box('reb','<b>Unbalanced 20-22:</b> jump shift 1♣-1♥-2♠, game forcing.'),
 box('rsp','<b>Responder then:</b> after weak: ≤10 pass or correct · <b>11-12 invite</b>: 3 of opener\'s suit with 3+ (over 2M, Hx = support), else own 6-card suit at the 3-level, else 2NT · <b>13+ game</b>: 4M with a fit, else 3NT. Opener accepts an invite with 13-14.'),
 box('rsp','<b>After 1NT (12-14):</b> ≤10 pass (6-card major: 2M) · 11-12 2NT (6-card major: 3M) · 13+ 3NT (6-card major: 4M). <b>After 2NT (18-19):</b> 7+ game; 5-card major: 3M forcing (opener 4M with 3, else 3NT). <b>After 2NT (12-14, 2-level reply):</b> 11+ game.'),
 box('rsp','<b>After a reverse:</b> 10+ game (4M with a fit, else 3NT) · 6-9: raise the 2nd major with 4, give preference, rebid a 5-card suit, or 2NT; opener goes on with 17+. <b>After a jump shift:</b> never pass: 4M with a fit, else 3NT. <b>After a jump rebid:</b> 10+ (9+ after a 2-level reply) game, else pass.'),
 box('reb','<b>1M-1NT:</b> balanced pass (17-18 2NT, 19+ 3NT) · 6-card M: 2M (15-19 3M) · 4+ second suit: 2 of it (higher = reverse, 15+) · 20-22 jump shift. Responder: pass or preference; 8-10 accepts.'),
 box('note','Barrier = 2 of the opening suit; a new suit above it (reverse) shows extra strength. 5-5: open the higher, then show the lower.')])

# ---------------- E ----------------
E = f'''<div class="g2">{box('cnv','<b>2NT 20-22 bal:</b> pass 0-3 · 3NT 4+ · 3♣ Stayman (opener 3♦/3♥/3♠; then 4M with a fit, else 3NT) · 5-4 majors: 3♣, then Smolen over 3♦ (bid the four-card major) · 3♦/3♥ transfers (then pass 0-3; 4-5: <b>3NT = choice</b> with exactly 5, opener corrects to 4M with 3+; else 4M) · 4♦/4♥ Texas.')}{box('cnv','<b>2♣ 23+:</b> 2♦ negative 0-7 · positive 8+: 4+ suit 2♥/♠ or 5+ minor 3♣/♦; bal 8-9 2NT, 10-12 3NT. Opener after 2♦: 2♥/♠ 5+ suit · 3♣/♦ 5+ minor · 2NT 23-24 bal (0-1 pass, else as over 2NT) · 3NT 25-27 bal. <b>After a positive:</b> fit → 4NT (G) · no fit: own 5+ suit or 3NT (6NT with 33+); responder raises a major with 3, else 3NT.')}</div>
<div class="sp"></div>
{box('cnv','<b>Weak two (5-10 HCP, 6-card suit).</b> Responder: pass (2-card, under 14) · 3M with 3 trumps · 4M with 4+ trumps · <b>2NT ask with 14+</b>. Opener: 3M = minimum or no feature · bid an outside A/K = feature (8-10) · 3NT = solid AKQ suit.')}
<div class="sp"></div>
{box('cnv','<b>Pre-empts:</b> 3♣-3♠ = 7-card suit · 4♣-4♠ = 8-card suit · 0-10 HCP. Partner: change suit only if longer; with 3-4 top honours bid game (3♣/3♦ → 3NT, 4m → 5m, 4M: pass). <b>Over an opposing pre-empt (12+):</b> 6-card suit overcall at the 3-level, 7-card suit at the 4-level; double = takeout (3+ in all unbid suits).')}'''

# ---------------- F ----------------
F = f'''{box('cmp','<b>Overcalls:</b> 1-level 5+ good suit, 8+ · 2-level 6+ suit, 10+ · weak jump 6+ suit, 6-10 (partner raises to the fit\'s level: 3 with 3, 4 with 4) · <b>1NT 15-18</b> balanced with a stopper.')}
{box('cmp','<b>Takeout double:</b> 12+ (or 11 with perfect shape), 3+ cards in every unbid suit. Advancer: <b>4-card major first</b>, else longest suit · 0-8 lowest · 9-11 jump · <b>12+ cue-bid their suit</b> (GF): doubler shows a 4-card major, else 2NT with a stopper, else a minor; advancer picks the game (own 5-card major: 3-level, forcing). Never pass unless RHO bids.')}
<div class="g2">{box('cmp','<b>NEGATIVE DOUBLE</b> (partner opens, RHO overcalls, through 3♠). Shows the unbid major(s): 4♠ over 1m-(1♥) · 4♥ over 1m-(1♠) · 4-4 majors over 1♣-(1♦) · both minors over 1♥-(1♠). Points: 6+ (1-level), 8+ (2-level), 10+ (3-level). Opener: natural; jump = max; cue = GF. <b>Weak (4-8), 5+ in opener\'s minor: pre-emptive jump raise.</b>')}{box('cmp','<b>PENALTY DOUBLE:</b> double of an overcall at the 4-level or higher · double of a 1NT overcall, 8+ · with a trump stack at a lower level, pass; if partner reopens with a double, leave it in (reopening: see H).')}</div>
<div class="g2">{box('cmp','<b>REDOUBLE</b> after RHO doubles partner\'s opening: 10+, no fit, penalty-minded. If they run: double with 4+; <b>pass is forcing</b>, so redoubler doubles or bids (5-5: higher first, as it shows 5+ there, unless the lower has 2 of AKQ and the higher none). Otherwise bid naturally.')}{box('cmp','<b>Our 1NT opening doubled:</b> 2♦/♥/♠ natural sign-off (transfers off; 5-5: bid the lower) · redouble 7+ · <i>or Helvic (H)</i>. <b>Our 1NT overcall doubled:</b> systems on (Stayman, transfers) · redouble 8+, penalty-minded.')}</div>
{box('cnv','<b>CAPPELLETTI vs their strong 1NT</b> (8+ pts): <b>X</b> = penalty (16+ or a running suit) · <b>2♣</b> one-suiter (partner relays 2♦; pass with diamonds, else name it) · <b>2♦</b> both majors · <b>2♥</b> hearts + a minor · <b>2♠</b> spades + a minor · <b>2NT</b> both minors.')}
{box('cnv','<b>MICHAELS cue bid</b> (5-5; weak 6-10 or strong 16+): over 1♣/♦ = both majors · over 1♥/♠ = the other major + a minor (advancer bids 2NT to ask the minor). <b>UNUSUAL 2NT</b> = the two lowest unbid suits, 5-5, same strengths.')}'''

# ---------------- G ----------------
ltc = '''<table class="lt"><tr><th colspan="2">Opener</th></tr><tr><th>Points</th><th>Losers</th></tr>
<tr><td>11</td><td>8</td></tr><tr><td>12-14</td><td>7</td></tr><tr><td>15-17</td><td>6</td></tr><tr><td>18-19</td><td>5</td></tr><tr><td>20-22</td><td>4</td></tr><tr><td>23+</td><td>3</td></tr></table>
<table class="lt"><tr><th colspan="2">Responder</th></tr><tr><th>Points</th><th>Losers</th></tr>
<tr><td>0-5</td><td>10</td></tr><tr><td>6-9</td><td>9</td></tr><tr><td>10-11</td><td>8</td></tr><tr><td>12-15</td><td>7</td></tr><tr><td>16+</td><td>6</td></tr></table>'''
G = f'''{box('cnv','<b>After Jacoby shortness or side suit:</b> responder signs off in 4M, or bids 4NT with 31+.')}
{box('cnv','<b>RKCB 4NT</b> (only once a trump suit is agreed; otherwise quantitative). Key cards = 4 aces + the K of trumps. Replies: <b>5♣ 0 or 3</b> · <b>5♦ 1 or 4</b> · <b>5♥ 2 without Q</b> · <b>5♠ 2 with Q</b>.')}
{arrow}
{box('reb','<b>Asker:</b> missing two key cards → 5 of trumps · missing one → 6 of trumps · all five → 5NT (asks kings; show each king by bidding its suit in order). Cheapest non-trump bid asks for the trump Queen. <b>Warning:</b> with hearts trumps a 5♠ reply is past 5♥, so asker can only go 6♥ or 5NT.')}
{box('cnv','<b>WHEN TO ASK:</b> once a fit is found, your points + partner\'s shown minimum = <b>31+ → 4NT</b>. Ask only with <b>2+ key cards</b> yourself; with 0-1, bid game and let partner ask. Unclear reply (0 or 3, 1 or 4): work it out. With 31+ between you, the opponents can\'t hold 3 key cards (11+ pts), so 0/3 = 3; with 2+ yourself, 1/4 = 1. <b>Grand:</b> all five key cards + trump Q + a side king.')}
<div class="b cnv"><b>LOSING TRICK COUNT</b> (8+ card suit fit only, never NT). <b>24 − (opener losers + responder losers) = tricks; level = tricks − 6.</b> E.g. 24 − 14 = 10 tricks → 4-level. HCP→losers is approximate: count real losers when shape is unusual. <b>In every auction with a fit, competitive too, shape counts: if losers give 10 tricks (11 in a minor), bid game even when points say stop.</b><div class="ltw">{ltc}</div></div>'''

# ---------------- H (new) ----------------
Hp = f'''<div class="g2">
<div>{box('cmp','<b>SUPPORT DOUBLE</b> (the "positive" double): 1♣/♦/♥ – 1♥/♠ – (overcall up to 2 of responder\'s suit) – <b>X = exactly 3-card support</b>. If RHO doubled: <b>XX = exactly 3</b>. With 4+, raise (11-14 simple, 15-19 double raise).')}
{box('cmp','<b>Responder after the support double:</b> 0-9 cheapest bid in the major · 10-12 jump to 3M (or 2NT with 4 cards and a stopper) · 13+ 4M (or 3NT with 4 cards and a stopper). Opener accepts an invitation with 13+ or ≤6 losers.')}
{box('cmp','<b>UNASSUMING CUE BID</b> (partner overcalls): cue-bid opener\'s suit = 3+ support, 10+ (limit raise or better) · simple raise 3+, 6-9 · jump raise 4+, 4-8 (pre-emptive). Overcaller: cheapest rebid of the suit = minimum (8-12), jump to game = 13+ or ≤6 losers. Advancer then bids game with 13+. A <i>direct</i> cue bid is still Michaels.')}</div>
<div>{box('cnv','<b>HELVIC WRIGGLE</b> (option when our 1NT is doubled): <b>pass</b> = 7+ values (pass the forced redouble) or a wriggle (after opener\'s forced XX, bid 4-card suits up the line) · <b>XX</b> = weak one-suiter (opener bids 2♣, pass or correct) · <b>2♣/2♦/2♥</b> = this suit + the next one up. Opener: pass with 3+ in the suit shown, else bid the next suit up.')}
{box('cmp','<b>OPENER REOPENING</b> (their overcall passed round): 3+ in their suit pass · 5-card second suit: bid it · 6+ own suit: rebid · else short in theirs: <b>double</b>. <b>AFTER OUR PENALTY DOUBLE / REDOUBLE:</b> double their escape with 4+ cards in it. <b>After we double their 1NT:</b> partner leaves it in unless 0-4 with a 5+ suit (take out, to play). If they run: double with 4+ in their suit, weak with a 5+ suit bid it, otherwise pass (forcing); doubler then doubles with 3+ or bids his longest suit.')}</div>
</div>'''

legend = ''.join(f'<span class="lg"><i class="sw {c}"></i>{t}</span>' for c, t in [('obk','Opening'),('rsp','Response'),('reb','Opener rebid'),('cnv','Convention'),('cmp','Competitive'),('note','Note')])

html = f'''<!doctype html><html><head><meta charset="utf-8"><title>5CM Strong NT - Bidding Flowchart (updated)</title><style>
@page {{ size: 1190.55pt 841.89pt; margin:0 }}
*{{box-sizing:border-box}}
html,body{{margin:0;padding:0}}
body{{width:1190.55pt;height:841.89pt;position:relative;font-family:"DejaVu Sans",sans-serif;font-size:7.15pt;line-height:1.23;color:#1b1b1b;background:#fff;overflow:hidden}}
.r{{color:#d0021b}} .ph .r{{color:#ffb3bd}} .ob .r{{color:#ff8a99}}
.top{{position:absolute;left:0;top:0;width:100%;height:52pt;background:#12233D;color:#fff;padding:7pt 16pt}}
.top h1{{margin:0;font-size:19pt;font-weight:700;letter-spacing:.2pt}}
.top p{{margin:3pt 0 0;font-size:8pt}}
.top .ver{{position:absolute;right:16pt;top:10pt;font-size:8pt;background:#f3d98b;color:#12233D;font-weight:700;padding:2pt 6pt;border-radius:3pt}}
.panel{{position:absolute;border:1.2pt solid var(--c);border-radius:5pt;background:#fff;overflow:hidden}}
.ph{{white-space:nowrap;background:var(--c);color:#fff;font-weight:700;font-size:8.4pt;height:17pt;padding:2.5pt 6pt;display:flex;align-items:center;gap:5pt}}
.let{{flex-shrink:0;display:inline-flex;width:12pt;height:12pt;border-radius:50%;background:#fff;color:var(--c);align-items:center;justify-content:center;font-size:8pt}}
.pb{{display:flex;flex-direction:column;gap:4pt}} .pF .pb{{gap:2.6pt}} .pF .b{{font-size:6.8pt;line-height:1.2}} .pK .fix,.pK .upd{{font-size:6.95pt}} .pH .b{{font-size:6.95pt}} .pD .b{{font-size:6.85pt;line-height:1.2}} .pD .pb{{gap:3pt}}
.pA,.pB,.pC{{--c:#2E5E9E}} .pD{{--c:#408A54}} .pE{{--c:#B07A0F}} .pF{{--c:#A33A3A}} .pG{{--c:#6B4A99}} .pH{{--c:#7A3550}} .pK{{--c:#7A6B1A}} .pO{{--c:#1F3B5E}}
.b{{border:0.8pt solid;border-radius:3pt;padding:3pt 4pt}}
.rsp{{background:#E6F0FA;border-color:#4A7BC0}} .reb{{background:#E6F5EB;border-color:#4FA066}} .cnv{{background:#FFF2D6;border-color:#D19A2A}}
.cmp{{background:#FAE6E6;border-color:#C05050}} .note{{background:#F2F2F2;border-color:#9A9A9A}}
.ob{{background:#1F3B5E;color:#fff;border-radius:3pt;padding:3.5pt 5pt}}
.lab{{font-style:italic;color:#555;font-size:6.9pt;margin:1pt 0 -2pt}}
.arr{{text-align:center;color:#555;font-size:6pt;line-height:6pt;height:6pt}}
.g2{{display:grid;grid-template-columns:1fr 1fr;gap:4pt}} .g3{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4pt}}
.g5{{display:grid;grid-template-columns:repeat(5,1fr);gap:4pt;align-items:start}}
.span2{{grid-column:span 2}} .span3{{grid-column:span 3}} .mt{{margin-top:-1pt}} .sp{{height:4pt}}
.col{{display:flex;flex-direction:column}} .g2>div:not(.b),.g3>div:not(.b),.g5>div:not(.b){{display:flex;flex-direction:column;gap:3pt}}
.g2>.arr{{display:block}}
.fix{{background:#F2F2F2;border:.8pt solid #9A9A9A;border-radius:3pt;padding:4pt 5pt}}
.upd{{background:#FFF2D6;border:.8pt solid #D19A2A;border-radius:3pt;padding:4pt 5pt}}
.upd h4{{margin:0 0 2pt;font-size:7.6pt;color:#7A6B1A}}
.ltw{{display:flex;gap:6pt;margin-top:4pt}}
table.lt{{border-collapse:collapse;font-size:7pt}}
table.lt th{{background:#f3d98b;border:.6pt solid #b08c2f;padding:1pt 6pt}} table.lt td{{border:.6pt solid #b08c2f;padding:1pt 8pt;text-align:center;background:#fff}}
.legend{{position:absolute;left:16pt;top:818pt;display:flex;gap:14pt;font-size:7.4pt;align-items:center}}
.lg{{display:inline-flex;align-items:center;gap:4pt}}
.sw{{display:inline-block;width:16pt;height:9pt;border-radius:2pt;border:.8pt solid}}
.sw.obk{{background:#1F3B5E;border-color:#1F3B5E}}
.foot{{position:absolute;right:16pt;top:819pt;font-size:7.4pt;color:#333}}
</style></head><body>
<div class="top"><h1>5-CARD MAJORS · STRONG NT  -  CORRECTED BIDDING FLOWCHART</h1>
<p>Letters A-H link each opening bid to its response flowchart. Points are HCP. Alertable: transfers, Smolen, McKendrick, Jacoby, 3♣/3♦ raises, weak twos, 2♣, negative and support doubles, unassuming cue bid, Helvic.</p><span class="ver">Updated 27 Oct 2026</span></div>
{panel(16,60,204,338,'pO','','OPENING BIDS','<div class="pb" style="gap:5pt;padding:0">'+op+'</div>')}
{panel(212,60,689,375,'pA','A','RESPONSES TO 1NT (15-17)',A)}
{panel(697,60,932,375,'pB','B','RESPONSES TO 1♥/♠',B)}
{panel(940,60,1175,375,'pC','C',"RESPONSES TO 1♣/♦",C)}
{panel(16,346,204,808,'pD','D',"OPENER'S REBID (new-suit reply)",D)}
{panel(212,383,689,622,'pE','E','2NT · 2♣ · WEAK TWOS · PRE-EMPTS',E)}
{panel(212,630,689,808,'pH','H','SUPPORT DOUBLES · CUE BIDS · HELVIC · AFTER A PENALTY DOUBLE',Hp)}
{panel(697,383,932,808,'pF','F','COMPETITIVE AUCTIONS · DOUBLES',F)}
{panel(940,383,1175,808,'pG','G','SLAM TOOLS',G)}
<div class="legend">{legend}</div>
<div class="foot">Print on A3, or scale to fit A4. Arrows show the order of the auction.</div>
</body></html>'''
open(sys.argv[1], 'w').write(html)
