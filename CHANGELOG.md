# Changelog

## 2026-10-27 (evening)
- **Smolen over 2NT too:** 2NT – 3♣ – 3♦ – 3♥/3♠ shows four in the bid major and five in the other, as over 1NT; opener bids 4 of the five-card major with three, else 3NT. (It had been natural.) On the chart too.

## 2026-10-24 (later): latest rules from the trainer

### Changed
- **Set sizes:** every drill is 10 hands, chosen for the widest coverage. A set can set its own size with `size:`.
- **Mixed:** one hand from each of 10 different drills. Each new deal moves on to the drills the last one left out, so consecutive deals mix up the content and two or three cover every drill.
- **Our 1NT doubled (chart system):** weak and 5-5 in two of ♦/♥/♠, bid the lower suit (you can still run to the higher one at the 2-level if that is doubled too). The chart says so too.
- **After our redouble and their run, 5-5:** bid the higher-ranking suit unless the lower one is clearly better (two of the top three honours against none), e.g. ♠J10543 ♦AKQ106 bids 2♦. On the chart too.
- **Opener's minimum rebid with 6-4:** show a 4-card major first when it is below the barrier (1♦-1♥-1♠, 1♠-2♣-2♥); otherwise rebid the six-card suit (1♦-1♠-2♦, since 2♥ would be a reverse). On the chart too.
- **Transfer then 2NT (five cards, 8-9):** opener with 3+ in the major bids 3M with 15 and 4M with 16-17; with two, pass or 3NT as before. Responder passes 3M. These hands used to stop the drill. On the chart too.
- **From Monday's club session (chart D and F):**
  - Opener's jump rebid: a 7-card suit, or 5 losers or fewer, counts as the strong 15-19 band even with 11-14 HCP.
  - Responder after opener rebids a six-card major: a doubleton honour (Ax, Kx, Qx) is support; with 10-12 invite with 3M, with 13+ bid 4M. Opener accepts with 13-14 or 6 losers or fewer.
  - Partner's weak jump overcall: raise pre-emptively to the level of the fit (3 cards → 3-level, 4 → 4-level). New recipe in Competitive bidding.
  - After partner opens a minor and RHO overcalls at the 1-level: with 4-8 and 5+ cards in partner's minor, a pre-emptive jump raise, alongside the negative double. New recipe in Competitive bidding.
- **After the unassuming cue bid:** the overcaller jumps to game with 13+ HCP or 6 losers or fewer (6 losers opposite a limit raise's 8 = 10 tricks). On the chart too.
- **6-5 with a longer minor:** open the minor (longest suit first), then show the major; with 15-19, opener shows it at the first rebid. 1♣/1♦ no longer deny a five-card major outright.
- **Shape counts once a fit is found:** opener after a simple raise (≤5 losers 4M, 6 losers 3M try), after a limit raise (≤6 losers 4M), after Bergen 3♦ (≤5) or 3♣ (≤6); responder accepting a game try with ≤8 losers; responder after opener's simple raise (24 − (losers + 7) ≥ 10 → game). Points still decide when they say more.
- **General rule, every auction after a 1-of-a-suit opening:** once there's an 8-card fit (from what partner has shown plus your own length), count losers: your own plus an estimate for partner from their bids. If 24 − (yours + partner's) reaches 10 tricks in a major or 11 in a minor, bid game (`fitGame` in auction.js, rule id `LTC.fit-game`). Partner then passes. Not used in slam sequences, artificial raises, or NT and 2♣ auctions.
- **No more early stops:** every drill auction now reaches a contract (a test checks seeds 1-4). New continuations, all on the chart:
  - Responder after opener's minimum rebid: 11-12 invites (3 of opener's suit with 3+, own 6-card suit at the 3-level, or 2NT), 13+ bids game; opener accepts with 13-14.
  - After opener's 1NT rebid with a 5+ suit or 16+; after a 2NT rebid with a five-card major (3M forcing); after 2NT (12-14) following a 2-level reply.
  - After a reverse (10+ game; 6-9 raise, preference, rebid or 2NT; opener goes on with 17+) and a jump shift (never pass); after a jump rebid of a minor, or of a major following a 2-level reply.
  - After opener raises your minor (2NT/3NT by strength).
  - Opener's rebid after 1M-1NT and 1m-1NT; responder's answer. 1m-2NT with an unbalanced opener.
  - After Jacoby shortness or side suit: 4M, or 4NT with 31+.
  - 2♣ positive responses: opener with a fit asks RKCB; otherwise own suit or NT (6NT with 33+); responder raises a major with 3. These are in the Slam drill.
  - 2NT with 5-4 majors: 3♣ Stayman, then the five-card major over 3♦.
  - Partner's pre-empt with 3+ top honours: 3m → 3NT, 4m → 5m, 4M pass.
  - New suit then support with 17+ opposite a minimum: game, or 4NT with 31+. Opener after responder's sign-off in their own suit: pass (17+ after a reverse goes on).
  - When partner has just bid game, pass.
- **Raising 1♥/1♠ with 4+ trumps:** 7 losers or fewer counts as 13+ (game forcing). With a good side suit (5+ cards, two of the top three honours), bid it first and support afterwards; otherwise Jacoby 2NT. On the chart too.
- **Never repeat partner's bid:** if the rules want the contract partner has just bid (e.g. game), pass.
- **Loser count in competitive auctions too:** support doubles (responder's game decision, opener accepting an invitation), the unassuming cue bid (advancer after a minimum rebid), the redouble raise and the invitation after a support raise all bid game when 24 − (yours + partner's) reaches 10 tricks (`ltcGame` in competitive.js).
- **15 hands per drill**, Mixed included (a hand from every drill each deal).
- **Every chart rule is practised.** New hands for the rules that never came up: passing partner's 1NT, 1M or 1m; the 1NT response to 1M; new suit then support; 1m – 1M – 2NT; 2♣ positive responses; passing or answering 2NT; partner's weak two (pass, raise, 2NT ask and after the answer) and pre-empt (pass or raise); too weak for a weak two; opener's shape jump rebid and 6-5 rebid; 31+ with 0-1 key cards; opener's side suit over Jacoby; the 1NT opener after our 1NT is doubled (chart system). A test now fails if any rule is never asked.
- **RKCB:** an unclear reply is no longer read low. With 31+ between you the opponents hold at most 9 points, too few for three key cards, so 0/3 = 3; with 2+ of your own, 1/4 = 1. On the chart too.
- **Jacoby:** a good 5-card side suit is shown before shortness (a 5-5 hand always has a short suit, so the side suit was never shown). On the chart too.
- **Slam filter:** 31+ points only marks a slam hand when the auction reaches a contract, so 2♣ positive responses can be practised.
- **2NT, transfer, then 3NT:** exactly five cards offers the choice of games even with a singleton (as over 1NT). Six cards still bid game in the major. On the chart too.
- **Unbalanced 2♣ auctions:** new recipes in Strong openings: partner or you open 2♣ with a 5+ suit, 2♦, then the suit rebid and responder's answer.
- **Rotation of hand types:** every drill now works through its kinds of hand (recipes) in a fixed rotation from deal to deal, so drills with more kinds than hands (Competitive has 22) cover them all over a few deals. Mixed does the same within each drill each time it comes round, so Cappelletti, Michaels and the rest take their turn.
- **Mixed:** the slam hand is a small slam in two deals out of three (the coverage pick had favoured grand slams).
- **Chart layout:** the "Key fixes & updates" panel is gone (the changelog records changes). Panel D moved into its place and panel E is wider.
- **Continue button** sits above the bidding table, so you don't have to scroll down to move on.

### Added
- **"New hands for every drill"** on the home screen: every drill, chart and Helvic, moves to new hands. Best scores are kept.
- Tests for all of the above.

## 2026-10-24: merged the friend's version

His version (the bridge-bidding-trainer zip) added a lot of system content, and the corrected chart itself. It's now part of this structure, built on the 21 Oct work below (rule ids, `amb`/`gap` reasons, the four-seat engine), with tests. His code wasn't copied as it was: it kept three copies of the bidding logic, and had the bugs listed below. Every new answer has a rule id: `H.…` for chart H, `LTC.…`, and `GUIDE.…` for trainer guides.

### Added
- **The chart:** `docs/5CM_SNT_Bidding_Flowchart_A3.pdf` and `docs/build_chart.py`, which generates it.
- **Four-hand drills** where the opponents bid (`js/contested.js`): Penalty doubles (1NT overcall, 4-level jump, trap pass and reopening, redouble), Doubling their 1NT, Our 1NT doubled (chart or Helvic Wriggle, chosen with a switch on the home screen), Unassuming cue bid, Support doubles. Also the cue-bid route after partner's takeout double, added to Competitive bidding. The whole hand shows the opponents' calls and whether the contract is doubled.
- **Losing Trick Count drill:** count your losers and the tricks on a number pad, then make the chart's LTC decision after a limit raise.
- **Sets picked for variety:** each set deals 100 hands and keeps the 25 covering the most situations.
- **New hands:** the range-ask and weak minors opposite a 17-count, and Jacoby and raises with an 18-22 opener.

### Changed (to match the October chart)
- 5-5 hands open the higher-ranking suit (1♠ with both majors, 1♦ with both minors).
- Over 1♣, four diamonds and a 4-card major respond in the major.
- Advancing a takeout double: a 4-card major first; 12+ cue-bids their suit.
- Over 2NT, a transfer with 4-5 points and exactly five cards offers 3NT.
- Slam: with a fit and 31+, ask 4NT only with 2+ key cards, otherwise bid game. A Jacoby opener with 18+ and 2+ key cards bids 4NT at once. An unclear reply is read low. Kings and grand slams added.
- Opener with 13-14 after a limit raise decides by LTC.
- Responder after opener's rebid passes or gives preference with 10 or less; after a jump rebid in a major, bids game with 10+.
- Partner of a pre-empt passes, or raises to game with 3+ aces and kings.
- Trainer guides fill the commonest gaps in the chart, so fewer auctions stop early (when one does, the drill still says why). Non-slam drills skip slam hands.
- Mixed draws equally from every drill except LTC, and is listed last.
- The home screen no longer deals every set, so it opens quickly.

### Fixed (bugs in the friend's version, not carried over)
- **The same set dealt different hands on different devices.** Dealing stopped after 500 ms, so a slow phone got a different set (often 0-5 of the same 10 hands), and saved results attached to the wrong hands. Dealing now depends only on the seed.
- **An illegal bid was asked for.** After 5NT, a king shown above the trump suit (6♠ with hearts trumps) was followed by "sign off in 6♥". 5NT is now only asked when the side holds the trump queen, so a king shown leads to the grand.
- His version still had the three bugs fixed here on 20 Oct (range-ask sign-off, five key cards, best score lost), copied into each of its three engines.
- New trainer guides fill gaps where his version silently dropped whole kinds of hand (weak-two asks, 2♣ with a long suit, pre-empts). They're all listed in `docs/CHART-QUESTIONS.md`.

## 2026-10-21: rule ids, four-seat auctions, reasons for stopping

### Fixed
- **Responder forgot the support they had promised.** With 3-card support for opener's major and 13+, responder bids a new suit first, "then support". Afterwards the trainer bid 3NT over opener's 1NT (missing the 5-3 fit), or stopped. Responder now bids game in opener's major opposite a minimum rebid (see CHART-QUESTIONS, reading 9).
- **Two thresholds for one bid.** Opposite opener's 18-19 2NT rebid, a 7-count bid 3NT after a suit response but passed after a 1NT response. Both now bid 3NT with 7+ (see CHART-QUESTIONS, reading 8).
- **The best score could be raised after seeing the answers.** Once every hand was answered, you could tap a missed hand's dot, bid it again correctly, and the best score went up. A hand already played can still be bid again, but it is now marked as practice and its first result stands.
- **Game auctions that never ended.** 1♥ – 1♠ – 2♠ – 4♠, 1NT – 2NT – 3NT, 1NT – 4NT – 6NT and 2♣ – 2♦ – 3NT said "The chart stops here" instead of giving the final contract. The obvious pass is now automatic.

### Changed
- **When an auction stops early, the drill says why**, for example "The drill ends here. With 13-14 opposite a limit raise, the chart gives no call." Rules now return `amb(why)` (the chart allows more than one call) or `gap(why)` (the chart has no call) instead of `null`.
- **Every rule has an id**, such as `'A.stayman'`, as the third argument of `R(bid, why, id)`. The chart letter shown under each answer is its first part. The tests check every id, and print which rules no drill ever asks of you.
- **The engine keeps the whole auction, all four seats.** `auctionState` says whose turn it is and what each side has bid; `chartCall` sends contested auctions to chart F. The competitive drills now go through the same engine, and `simulate` takes an optional function for the opponents' calls. Opponents still always pass in the whole-auction drills.
- **Auctions now end properly**: four passes, or a bid followed by three passes, so the closing pass is shown.
- **Drill recipes take named options**: `SO({ south: {...}, north: {...}, calls })` and `PO({ setup, calls })` instead of up to nine arguments in a fixed order.

Apart from the fixes above, the bidding is unchanged, and no dealt hand changed. This was checked by comparing every hand of every set for six seeds, plus 20,000 random auctions, before and after each step. Where an expected answer changed (only some deals of "Responding to 1♣/1♦" among seeds 1-6, none of them the first deal), that set's saved progress is reset; best scores are kept.

## 2026-10-20: jump to any hand

### Added
- **Click a progress dot to jump to that hand.** Unplayed hands can be played in any order; a hand already played can be bid again, and the new result replaces the old one. "Next hand →" now goes to the next unplayed hand, and "See results" appears once every hand has been played.

## 2026-10-20: passed-out hands

### Fixed
- **"Partner passed" with an opening hand.** In the "too weak to open" drill, partner could hold an opening hand, but the trainer stopped after South's pass, and said the hand was passed out. Partner is now always dealt a hand that also passes; partner's pass is shown with its reason, and the auction shows all four passes.

## 2026-10-20: review and restructure

### Fixed
- **The page did not load.** `index.html` loads its scripts from `js/`, but the files were in the top folder. They now live in `js/`.
- **1NT – 2♠ with 8 HCP and a six-card minor.** Responder bid the weak "3♦ to play" opposite a maximum. It now passes 2NT, or bids 3NT over 3♣, as the range-ask explanation says.
- **RKCB with all five key cards** answered 5♦ "shows 1 or 4". The chart has no reply for five, so the auction now stops there.
- **Best score lost.** If you answered the last hand of a set and left without pressing "See results", the best score was never saved. It is now saved as soon as the last hand is answered.
- **Saved progress could point at the wrong hands** after the drills changed. Progress now carries a fingerprint of its hands, and is reset when they change. Best scores are kept.
- **Explanations** said "six" for seven-card suits, "no long suit" for hands with a five-card suit, and "(11-12)" for an opener with exactly 12.
- A drill recipe that never succeeds could leave a set short of hands and crash the page. It is now skipped after 2,000 tries.
- Damaged saved data no longer breaks the page. Any unexpected error shows a recovery screen instead of a blank page.
- `download` was really a `.gitignore` file; it has been renamed.

### Changed
- The code is laid out readably, with comments. Card helpers moved into `js/cards.js`; follow-up rules moved from `auction.js` into `rules.js`; `sysCall` is split into one function per opening bid. Apart from the fixes above, the bidding is unchanged. This was checked by comparing 51,500 lines of output (every hand of every set for six seeds, plus 50,000 random deals) before and after.
- Two functions that were never used (`over2N` and `replyFor`) were removed.
- Strain buttons have screen-reader labels; the page has a favicon and a no-JavaScript message.

### Added
- `tests/`: 55 tests (chart examples, regressions, every drill set over 20 seeds, a 20,000-deal fuzz, and click-through tests of the page). Open `tests/index.html`, or run `bash tests/run.sh`.
- A GitHub Actions workflow that runs the tests on every push.
- `docs/HOW-IT-WORKS.md`, `docs/CHART-QUESTIONS.md` and `docs/ROADMAP.md`.
