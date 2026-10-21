# Where to take it next

Ideas, roughly in order of value for effort. Each one says what it would take.

## Quick wins (an evening each)

- **Keyboard bidding.** Type `1` then `N`, `P` for pass, `X` to double, Enter for "next". It makes drilling much faster on a laptop. Everything is in `play()` in `js/app.js`.
- **Close the chart gaps.** Answering the open items in [CHART-QUESTIONS.md](CHART-QUESTIONS.md) makes auctions longer and more realistic. Each answer is usually one or two lines in `js/auction.js`, plus a test.
- **Works offline / installable on a phone.** Add a web app manifest and a small service worker, so the trainer can be added to the home screen and used at the club without signal.
- **Share a hand.** Put the set, seed and hand number in the URL (`#nt-resp/3/12`), so partners can open exactly the same deal and argue about it.

## Bigger steps (a weekend each)

- **Practise your weak spots.** Every rule already has an id (`'A.stayman'`, `'B.jacoby'`, …), and each answer carries it. Record right and wrong answers per id in saved progress, give the ids readable names, and add a "Weakest topics" drill that deals more of what you get wrong. The chart letters are a ready-made coarser grouping.
- **Drill the rules nobody is asked.** The tests print which rule ids no drill ever asks of you (for example "new suit first, then support", and passing partner's opening with a weak hand). A recipe or two per set would close most of the list.
- **The chart inside the app.** A reference page for each chart (A-G), linked from the "Chart A · …" line under each answer, so users can read the full rule they just got wrong.
- **Opponents who bid.** Today opponents always pass, except in the one-call competitive drills. The engine is ready for more: it keeps all four seats, sends contested auctions to chart F (`competitive` in auction.js), and `simulate` takes an `opponents(state)` function for East and West's calls (there is a test where East overcalls). What is missing: East and West's hands, so they overcall only when they should (the `overcall` rule already exists), and the partnership's continuations after interference. Start small: one overcall over a 1-level opening.
- **Play the other seat.** Let the user sit North (opener) as well as South, or alternate. The engine already bids both seats, so this is mostly UI.

## Larger projects

- **Partnership mode.** Two people on two phones bid the same deal, then compare their auction with the chart's. The shared deal can come from the seed, as above; real-time sync needs a small backend.
- **Make the system configurable.** Move ranges like "1NT = 15-17" and "Stayman 8+" into one settings object, so another partnership can play 12-14 no-trumps without editing rules. Do this only once the chart is stable: it touches almost every rule.
- **Did the contract make?** Use a double-dummy solver (one compiled to WebAssembly runs in the browser) to show whether the chart's final contract makes, and what par is. It turns "the chart says" into "and here's why it's right".
- **Import real deals.** Read PBN files from club sessions, so members can drill hands they actually played.

## Engineering, as it grows

- Keep running `tests/run.sh` (GitHub does this on every push). Add a test with every rule change.
- If the code grows much beyond its current size, consider ES modules (`<script type="module">`). They need no build step and work on GitHub Pages as they are. The cost is that browsers will not load modules from a file opened from disk, so local use would need Live Server (already recommended in the README). The gain is that each file says what it uses, so two files can no longer clash by defining the same name. Not worth it yet: today's "open `index.html`" simplicity is a real feature.
- A code formatter and linter (Prettier and ESLint) would keep the style consistent once Node.js is installed.
