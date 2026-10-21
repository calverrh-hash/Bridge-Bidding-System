# Changelog

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
