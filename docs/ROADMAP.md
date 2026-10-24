# Where to take it next

Ideas, roughly in order of value for effort. Each one says what it would take.

## Done so far

- Rule ids on every answer, and a reason whenever an auction stops.
- An engine that keeps all four seats, and four-hand drills where the opponents bid: penalty doubles, their 1NT, our 1NT doubled (with Helvic), the cue bid after a takeout double, the unassuming cue bid, support doubles.
- The losing trick count drill, with a number pad.
- Sets picked for variety, the same on every device.
- Click a progress dot to jump to any hand (re-bidding a played hand is practice).

## Quick wins (an evening each)

- **Close the chart's open questions.** Every answer to [CHART-QUESTIONS.md](CHART-QUESTIONS.md) ("Still open") lets more auctions reach a contract. Each is usually one or two lines in `js/auction.js`, plus a test and a line on the chart.
- **Drill the rules nobody is asked.** The tests print which rule ids no drill ever asks of you (for example "new suit first, then support", the weak-two ask, and passing partner's opening with a weak hand). A recipe or two per set would close most of the list.
- **Keyboard bidding.** Type `1` then `N`, `P` for pass, `X` to double, and digits on the number pad; Enter for "next". It makes drilling much faster on a laptop. Everything is in `play()` in `js/app.js`.
- **Works offline / installable on a phone.** Add a web app manifest and a small service worker, so the trainer can be added to the home screen and used at the club without signal.
- **Share a hand.** Put the set, seed and hand number in the URL (`#nt-resp/3/12`), so partners can open exactly the same deal and argue about it.

## Bigger steps (a weekend each)

- **Practise your weak spots.** Every answer carries a rule id (`'A.stayman'`, `'B.jacoby'`, …). Record right and wrong answers per id in saved progress, give the ids readable names, and add a "Weakest topics" drill that deals more of what you get wrong. The chart letters are a ready-made coarser grouping.
- **The chart inside the app.** A reference page for each section (A-H), linked from the "Chart A · …" line under each answer, so users can read the full rule they just got wrong. The chart's text is already in `docs/build_chart.py`.
- **Opponents in the ordinary drills.** The engine is ready: it keeps all four seats, sends contested auctions to chart F (`competitive` in auction.js), and `simulate` takes an `opponents(state)` function for East and West's calls. What's missing: East and West's hands, so they overcall only when they should (the `overcall` rule already exists), and the partnership's continuations after interference. The four-hand drills' rules (negative and support doubles, the cue bids) are a start. Begin small: one overcall over a 1-level opening.
- **Play the other seat.** Let the user sit North (opener) as well as South, or alternate. The engine already bids both seats, so this is mostly UI.

## Larger projects

- **Partnership mode.** Two people on two phones bid the same deal, then compare their auction with the chart's. The shared deal can come from the seed, as above; real-time sync needs a small backend.
- **One source for the chart and the rules.** Today the chart (`build_chart.py`) and the rules (`js/`) are kept in step by hand. Moving the ranges ("1NT = 15-17", "Stayman 8+") into one settings file that both read would stop them drifting apart, and let another partnership play, say, 12-14 no-trumps. Only worth it once the chart is stable: it touches almost every rule.
- **Did the contract make?** Use a double-dummy solver (one compiled to WebAssembly runs in the browser) to show whether the chart's contract makes, and what par is. It turns "the chart says" into "and here's why it's right".
- **Import real deals.** Read PBN files from club sessions, so members can drill hands they actually played.

## Engineering, as it grows

- Keep running `tests/run.sh` (GitHub does this on every push). Add a test with every rule change.
- If the code grows much beyond its current size, consider ES modules (`<script type="module">`). They need no build step and work on GitHub Pages as they are. The cost is that browsers won't load modules from a file opened from disk, so local use would need Live Server (already recommended in the README). The gain is that each file says what it uses, so two files can no longer clash by defining the same name. Not worth it yet: today's "open `index.html`" simplicity is a real feature.
- A code formatter and linter (Prettier and ESLint) would keep the style consistent once Node.js is installed.
