# Changelog

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
