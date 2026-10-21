# Strong NT Bidding Trainer

Practice bidding drills for a 5-card majors / strong 1NT (15-17) system. You sit South and bid whole auctions. Partner is dealt a real hand and bids by the same chart.

## Run it

Open `index.html` in a browser. No install or build step is needed.

In VS Code, install the **Live Server** extension (by Ritwick Dey) to reload the page every time you save. Then right-click `index.html` and choose **Open with Live Server**.

## Test it

Open `tests/index.html` in a browser. The page runs every test and lists the results: green means all passed. Your real saved progress is not touched.

From a terminal (Git Bash on Windows, or Linux/macOS), run `bash tests/run.sh`. It uses Chrome, Chromium or Edge in the background and fails if any test fails. GitHub runs the same script on every push (see the **Actions** tab).

**Run the tests after every change to the chart or the drills.** They check worked examples of the chart, and they deal 20 rounds of every drill set to make sure every hand is legal and every explanation matches the hand.

## Put it online with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. After a minute the trainer is live at `https://<your-username>.github.io/<repo-name>/`.

## Where things live

| File | What it holds |
|---|---|
| `index.html` | The page. Loads the scripts below, in this order. |
| `js/cards.js` | Building blocks: suits, calls, HCP, balanced shapes, the seeded random numbers and dealing. |
| `js/rules.js` | The chart: one function per decision (openings, responses to 1NT/1M/1m, opener's rebid, competitive bids, 2NT/2♣/weak twos, Jacoby and RKCB). Change a range or a convention here. |
| `js/auction.js` | Keeps the whole auction, all four seats (`auctionState`), picks which rule applies at each point (`chartCall`, `sysCall`) and plays a whole auction (`simulate`). |
| `js/drills.js` | The drill sets. Each recipe deals one kind of hand. Add a recipe to get more hands of that kind. |
| `js/app.js` | The page itself: home screen, bidding box, feedback, results and saved progress. |
| `style.css` | Colours (light and dark), type and layout. |
| `tests/` | The tests (see above). |
| `docs/` | How it works, open questions about the chart, and ideas for what to build next. |

Each answer's explanation is written next to its rule, as the second argument of `R(bid, why, ruleId)`. The rule id starts with the chart letter: `'A.stayman'` is the Stayman rule in chart A.

More detail: [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) explains the code and walks through changing a rule or adding a drill. [docs/CHART-QUESTIONS.md](docs/CHART-QUESTIONS.md) lists places where the chart is silent or the trainer reads it one particular way. [docs/ROADMAP.md](docs/ROADMAP.md) has ideas for the future. [CHANGELOG.md](CHANGELOG.md) records what has changed.

## Notes on chart readings

- A hand is only dealt if your **first** call is unambiguous. Later in the auction, if the chart allows more than one call (or gives none), the auction stops there and the drill says why.
- Only your first attempt at a hand is scored. Bidding a played hand again (from the progress dots) is practice.
- Auctions end where the chart gives no next step (for example, opener with 13-14 after a limit raise, or cue-bidding after Jacoby).
- After Jacoby 2NT the trainer asks for key cards with about 31+ combined points. This is a trainer guide, not part of the chart.
- Over a 2NT transfer, "4M with 4-5" is read as 4-5 HCP.
- Opponents always pass, except in the one-call competitive drills.

Progress is saved in the browser (localStorage), so each person keeps their own scores. If the drills change so that a set deals different hands, that set's unfinished progress is reset; best scores are kept.
