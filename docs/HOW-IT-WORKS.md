# How the trainer works

This guide is for anyone changing the chart or the drills. You don't need to know much JavaScript: most changes are one line in `js/rules.js`, `js/competitive.js` or one of the drill files.

## The big picture

```
drills.js /    a recipe deals South a hand (and partner's, or all four hands)
contested.js
   │
auction.js     simulate() plays the auction, all four seats: at each turn chartCall() picks the
   │           chart rule, the rule in rules.js returns the call; opponents pass.
   │           sim4() plays a scripted four-hand auction: the recipe gives each call, ours from
   │           competitive.js, the opponents' by simple rules.
   │
drills.js      buildSet() deals a pool of 100 hands from a seed and keeps the 15 that cover
   │           the most different situations
   │
app.js         shows each of South's calls as a question and checks the answer
```

The same set and seed always deal the same hands, on any device: nothing depends on timing. "Deal 15 new hands" moves the set to the next seed; "New hands for every drill" on the home screen moves every set (chart and Helvic versions) to its next seed and keeps best scores.

## How things are written

**Suits** are numbers: `0` clubs, `1` diamonds, `2` hearts, `3` spades. In bids, `4` is no-trump.

**A hand** is four lists of ranks, clubs first: `[[14, 3], [13, 9, 2], …]`. Ranks run 2-14, where 11 = J, 12 = Q, 13 = K and 14 = A. In tests you can write a hand the usual way, spades first: `parseHand('AKQ2.K53.Q72.J4')`.

**A call** is a short string: `'1C'` … `'7N'`, `'P'` (pass), `'X'` (double), `'XX'` (redouble).

**A chart answer** is `R(bid, why, ruleId)`, for example:

```js
R('2C', `${p} HCP with a 4-card major: 2♣ Stayman (8+).`, 'A.stayman')
```

`why` is the explanation the user sees. `ruleId` names the rule: a prefix, a dot, then a short name in lower case with hyphens. The prefix is shown under the answer:

| Prefix | Shown as |
|---|---|
| `OB`, `A`-`H` | the chart section (opening bids, A responses to 1NT, … H support doubles, cue bids, Helvic) |
| `LTC` | Chart G · Losing trick count |
| `GUIDE` | Trainer guide: the chart is silent here. Every guide is listed in [CHART-QUESTIONS.md](CHART-QUESTIONS.md). |

The full id lets tests point at one rule, and is what per-topic scores will be kept against. Several lines can share an id when they are the same rule (Stayman with different hands, say); give a new rule a new id. `AP(why)` is an automatic pass (partner placed the contract); it's never asked of the user.

**When there is no single call**, a rule returns one of these instead, with a reason the user will see:

```js
amb('With 5-5 in the majors, the chart allows a transfer to either major.')   // more than one call
gap('The chart gives opener no rebid after a 1NT response.')                  // no call at all
```

This matters:

- If South's **first** call is `amb` or `gap`, the hand is thrown away and never dealt.
- If any **later** call is `amb` or `gap`, the auction stops there, and the drill shows the reason ("The drill ends here. …").

So when a hand could fairly be bid two ways, return `amb(…)` rather than guess. That's how every answer stays unambiguous. Write the reason so it makes sense whoever is to call: it can be shown on partner's turn, so say "opener" or "responder" rather than "you" or "partner".

Small helpers used everywhere (all in `js/cards.js`):

| Helper | Means |
|---|---|
| `hcp(h)`, `L(h)`, `isBal(h)` | high-card points, suit lengths `[C, D, H, S]`, 4333/4432/5332 |
| `has(h, s, r)`, `stop(h, s)`, `longest(h)` | holds rank `r` in suit `s`? a stopper? the longest suit |
| `losers(h)`, `loserBreak(h)` | losing trick count, and the suit-by-suit working |
| `B(level, suit)` | builds a bid: `B(2, 3)` is `'2S'` |
| `bv(bid)` | bid order, so `bv(a) > bv(b)` means `a` outranks `b` |
| `cheapest(s, bid)`, `lastBid(calls)` | the cheapest level for suit `s` over a bid; the last bid in an auction |
| `isCall(x)` | is `x` a real call, rather than `amb(…)` or `gap(…)`? |
| `plain(bid)`, `SY[s]`, `SN[s]`, `NUM[n]`, `cardsOf(n, s)` | `3♥`, `♥`, `hearts`, `six`, `one club` for explanations |

## Changing a rule

Say the chart changes Stayman from 8+ to 9+.

1. Open `js/rules.js` and find `// ---------- A: responses to 1NT ----------`.
2. In `r1NT`, change `if (p >= 8) return R('2C', …(8+)…, 'A.stayman')` to `p >= 9`, and update the text.
3. Look for the knock-on effects. What does a hand with exactly 8 and a 4-card major bid now? Make sure some line returns a call for it, or `amb(…)` / `gap(…)` on purpose.
4. Run the tests (open `tests/index.html`). Fix the examples in `tests/engine.test.js` that expected the old chart, and add one for the new rule.
5. Change the chart: `docs/build_chart.py`.

Where each part of the auction is decided:

| Situation | Function |
|---|---|
| Opening bid | `openingBid` (rules.js) |
| Responding to 1NT, then later calls | `r1NT`, `stayAns`, `afterStay`, `afterXfer`, `inv`, `inv4`, `smolenAns`, `rangeAns`, `rangeResp` |
| Responding to 1♥/1♠ | `r1M`, then `jac` / `jacCont` for Jacoby, `supportAfterNewSuit` after "new suit first, then support", `ltcLimit` after a limit raise |
| Responding to 1♣/1♦ | `r1m` |
| Opener's rebid, responder's next call | `rebid`, `respAfterRebid` |
| 2NT, 2♣, weak twos | `over2Nx`, `over2C`, `twoClubRebid`, `wtResp`, `wtAns` (and `nt2` in auction.js) |
| Slam | `slamTry` (when to ask), `rkReply`, `askDecide`, `kingReply`, `grandDecide` |
| Competitive (competitive.js) | `overcall`, `negDbl`, `advance`, `vs1NT` (chosen by `competitive` in auction.js); `cueAnswer`, `cuePlace`, `reopen`, `penaltyFollow`, `ntDblAdvance`, `ntDoubledCall` (Helvic), `ucbAdvance`, `supCall`, `supResp` (used by the four-hand drills) |

Short answers to partner's bids are written directly in `js/auction.js`, in the `after…` function for each opening (`after1NT`, `after1Major`, `after1Minor`, `after2C`, `afterWeakTwo`, `afterPreempt`). Each checks `n`, the number of partnership calls so far: `n === 1` is the response, `n === 2` opener's rebid, and so on. **To add a continuation** where an auction now stops, add a line there.

**To check what you bid earlier**, call your own rule again: your earlier calls were always the chart's, so `r1M(h, M).id === 'B.new-suit-then-support'` tells responder that their first call promised three-card support. `after1Major` uses exactly this.

## The auction: all four seats

`auction.js` keeps the whole auction, all four seats, starting with the dealer. `auctionState(dealer, calls)` describes it from the point of view of the player about to call:

| Field | Means |
|---|---|
| `seat`, `partner`, `lho`, `rho` | whose turn it is, and the other three seats |
| `ours` | our side's calls in order: the partnership sequence the `after…` functions read |
| `theirs` | the opponents' calls |
| `contested` | the opponents have made a call other than pass |
| `tagged` | every call with the seat that made it: `{ call, by }` |

`chartCall(state, hand)` picks the rule. Uncontested auctions go to `sysCall(ours, hand)`. Contested ones go to `competitive`, which covers your first call after the other side opens, a negative double after partner opens and RHO overcalls, and advancing partner's takeout double. Everything later in a contested auction is a `gap` there.

`simulate(south, north, dealer, note, opponents)` plays the auction until it ends (four passes, or a bid followed by three passes) or the chart stops. East and West call with `opponents(state)`; leave it out and they always pass. The one-call competitive drills use `chartCall` directly, through `oneCall` in drills.js.

**The four-hand drills** (contested.js) need more than that: the opponents keep bidding, and our side's later calls (leaving a penalty double in, Helvic's wriggles, answering a cue bid) depend on the drill. So each recipe deals all four hands and describes the auction with a function `F(seat, calls, hand, n)` that returns each call, which `sim4` plays out. Our side uses the rules in competitive.js; the opponents use `OC(bid, why)` scripts. See `PEN_NT` for a short example.

## Adding or changing a drill

Drills live in `js/drills.js` (uncontested, LTC and Mixed) and `js/contested.js` (four hands). Each set is:

```js
{ id: 'nt-resp', name: 'Responding to 1NT', refs: 'A', blurb: '…', recipes: [ … ] }
```

Optional flags: `slam: true` lets the set keep slam hands (other sets skip them); `helvic: true` means its hands depend on the Chart/Helvic switch; `last: true` lists it at the end of the home screen.

A **recipe** deals one kind of hand. Recipes take `(rng, opts)`; `opts.helvic` is the Chart/Helvic switch, and most recipes ignore it. There are two helpers for whole-auction drills, and both take named options.

**`SO({...})`: South opens.**

```js
SO({ south: { lens: balL, hcp: [15, 17] }, north: { lens: majSpec, hcp: [6, 15] }, calls: 2 })
```

- `south.lens(rng)` gives South's suit lengths; `south.hcp` is South's range; `south.ok(hand)` is an optional extra test.
- `north.lens(rng, southHand)` gives North's length spec (leave it out for any shape); `north.hcp` is North's range; `north.ok(hand)` is an optional extra test.
- `calls` is how many calls South must make for the hand to count. It can be left out: the default is 2.

**`PO({...})`: Partner opens.** `setup(rng)` describes one deal. It's a function because partner's suit is often chosen at random and both hands depend on it:

```js
PO({ setup: r => ({
  south: { lens: nmaj(r), hcp: [8, 8] },                   // no 4-card major, exactly 8 HCP
  north: { lens: 'bal', hcp: [15, 17], opens: '1N' },      // balanced 15-17 that opens 1NT
  note: 'Partner opened 1NT (15-17).',
}) })
```

`NT1` holds the usual `north` and `note` for a 1NT opening, so many recipes are just `PO({ setup: r => ({ ...NT1, south: {…} }) })`.

Lengths are written with `sp`: `sp({2: [5, 6]}, [0, 5])` means 5-6 hearts and 0-5 in each other suit. `balL` is any balanced pattern, and `'bal'` means the same for partner.

**Counting steps** (the LTC drill) are steps with `kind: 'num'` and `opts: ['0', '1', …]`. The app shows a number pad instead of the bidding box.

**How a set is chosen:** `buildSet` deals recipes in turn until it has 100 good hands (at least four times the set size). Then it picks `setSize(def)` hands (15, unless the set gives `size:`) that cover the most different situations: recipes, auctions, your calls, partner's calls and results.

**Mixed** is built by `buildMixed` instead: one hand from each of 15 drills in turn (every drill except LTC, so one comes twice) (every drill except LTC). The drills are in a fixed shuffled order and each seed starts where the previous seed stopped, so seed 2 covers the drills seed 1 left out, and two or three deals in a row cover them all. Within each drill it deals 8 hands and keeps the one that adds the most new situations to the set. To get more hands of a kind, repeat its recipe in the list (name it, `const nt = SO({...})`, and list the name twice). A recipe gets skipped after 300 failures in a row, so one broken recipe can't freeze the app; the tests check every set still deals its full size.

The tests end with a **rule coverage** line: which rule ids no drill ever asks of you. It's the quickest way to see what a new recipe should target.

**Be aware:** changing, adding or reordering recipes changes which hands every seed deals. That's fine: the app notices and resets unfinished progress for that set (best scores are kept). But it's why a small edit can change many hands.

## The page (`js/app.js`)

Everything on screen is drawn by `render()` from one state object, `S`. The views are `home()`, `play()` and `done()`. Clicking a button changes `S` and calls `render()` again.

Saved data lives in the browser under the key `bidtrainer.v2`:

```js
{ seed: { key: 1 }, best: { key: 23 }, prog: { key: { seed, sig, res: [...] } }, opts: { helvic: false } }
```

`key` is the set id, plus `~helvic` for sets that depend on the Helvic switch, so each system keeps its own progress. `sig` is a fingerprint of the dealt hands, so progress saved against old hands is never misread after the drills change. The home screen doesn't deal any sets, so it opens instantly; a set is dealt (and its saved progress checked) when you open it.

Only a hand's **first** attempt is scored. A hand already played can be bid again from the progress dots, but that's practice (the page says so): the feedback is shown, and the first result stands. This keeps the score and best score honest, since you've already seen the answer. Damaged saved data is ignored. Any unexpected error shows "Something went wrong" with buttons to go back or reset, instead of a blank page.

## Rules of the road

- **Script order matters.** `index.html` loads `cards.js`, `rules.js`, `competitive.js`, `auction.js`, `drills.js`, `contested.js`, then `app.js`. All of them share one global namespace, so two files must never define the same name.
- No build step and no libraries. The page works when opened straight from disk, and on GitHub Pages.
- Run the tests before you push. GitHub runs them too, and shows a red cross on the commit if they fail.
- Keep the chart and the trainer in step: change `docs/build_chart.py` with the rules, and list any new trainer guide in [CHART-QUESTIONS.md](CHART-QUESTIONS.md).

**Every rule gets practised.** A recipe can be wrapped in `want(recipe, ruleId)`, which keeps only deals where you are asked that rule. Rare rules (a 2♣ positive, passing partner's weak two, opener's side suit over Jacoby) have such recipes. The test "rule coverage" fails if any chart rule is never asked in seeds 1-8; the only exception is `PARTNER_ONLY` (calls that are always partner's in the drills).
