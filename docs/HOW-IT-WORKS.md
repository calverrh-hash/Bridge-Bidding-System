# How the trainer works

This guide is for anyone changing the chart or the drills. You do not need to know much JavaScript. Most changes are one line in `js/rules.js` or `js/drills.js`.

## The big picture

```
drills.js   a recipe deals South a hand (and North one that fits the drill)
   │
auction.js  simulate() plays the auction: at each turn sysCall() picks the chart rule,
   │        the rule in rules.js returns the call; opponents pass
   │
drills.js   buildSet() keeps hands that work and collects 25 of them, from a seed
   │
app.js      shows each of South's calls as a question and checks the answer
```

The same set and seed always deal the same 25 hands. "Deal 25 new hands" moves the set to the next seed.

## How things are written

**Suits** are numbers: `0` clubs, `1` diamonds, `2` hearts, `3` spades. In bids, `4` is no-trump.

**A hand** is four lists of ranks, clubs first: `[[14, 3], [13, 9, 2], …]`. Ranks run 2-14, where 11 = J, 12 = Q, 13 = K and 14 = A. In tests you can write a hand the usual way, spades first: `parseHand('AKQ2.K53.Q72.J4')`.

**A call** is a short string: `'1C'` … `'7N'`, `'P'` (pass), `'X'` (double), `'XX'` (redouble).

**A chart answer** is `R(bid, why, chart)`, for example:

```js
R('2C', `${p} HCP with a 4-card major: 2♣ Stayman (8+).`, 'A')
```

`why` is the explanation the user sees. `chart` is the chart letter shown under it (`A`-`G`, or `OB` for opening bids).

**Returning `null`** means "the chart gives no single clear call here". This matters:

- If South's **first** call is `null`, the hand is thrown away and never dealt.
- If any **later** call is `null`, the auction stops there ("The chart stops here").

So when a hand could fairly be bid two ways, return `null` rather than guess. That is how the trainer stays unambiguous.

Small helpers used everywhere (all in `js/cards.js`):

| Helper | Means |
|---|---|
| `hcp(h)` | high-card points |
| `L(h)` | suit lengths `[C, D, H, S]` |
| `isBal(h)` | 4333, 4432 or 5332 |
| `has(h, s, r)` | does the hand hold rank `r` in suit `s`? |
| `B(level, suit)` | builds a bid: `B(2, 3)` is `'2S'` |
| `bv(bid)` | bid order, so `bv(a) > bv(b)` means `a` outranks `b` |
| `plain(bid)` | `'3H'` → `3♥`, for explanations |
| `SY[s]`, `SN[s]`, `NUM[n]` | symbol `♥`, name `hearts`, number word `six` |

## Changing a rule

Say partner opens 1NT and the chart changes Stayman from 8+ to 9+.

1. Open `js/rules.js` and find `// ---------- A: responses to 1NT ----------`.
2. In `r1NT`, change `if (p >= 8) return R('2C', …(8+)…` to `p >= 9`, and update the text.
3. Look for the knock-on effects. What does a hand with exactly 8 and a 4-card major bid now? Make sure some line returns a call for it, or `null` on purpose.
4. Run the tests (open `tests/index.html`). Fix the examples in `tests/engine.test.js` that expected the old chart, and add one for the new rule.

Where each part of the auction is decided:

| Situation | Function |
|---|---|
| Opening bid | `openingBid` |
| Responding to 1NT, then later calls | `r1NT`, `stayAns`, `afterStay`, `afterXfer`, `inv`, `inv4`, `smolenAns`, `rangeAns`, `rangeResp` |
| Responding to 1♥/1♠ | `r1M`, then `jac` / `jacCont` for Jacoby |
| Responding to 1♣/1♦ | `r1m` |
| Opener's rebid, responder's next call | `rebid`, `respAfterRebid` |
| 2NT, 2♣, weak twos | `over2Nx`, `over2C`, `twoClubRebid`, `wtResp`, `wtAns` (and `nt2` in auction.js) |
| Competitive | `overcall`, `negDbl`, `advance`, `vs1NT` |
| RKCB | `rkReply`, `askDecide` |

Simple raises and other short answers to partner's bids are written directly in `js/auction.js`, in the `after…` function for that opening (`after1NT`, `after1Major`, …).

**To add a new continuation** (for example, opener's answer to an invitation that currently ends the auction), find the `after…` function for the opening. Each one checks `n`, the number of partnership calls so far: `n === 1` is the response, `n === 2` opener's rebid, and so on. Add a line for the new sequence.

## Adding or changing a drill

Drills live in `js/drills.js`. Each set is:

```js
{ id: 'nt-resp', name: 'Responding to 1NT', refs: 'A', blurb: '…', recipes: [ … ] }
```

A **recipe** deals one kind of hand. There are two helpers.

**`SO(...)`: South opens.**

```js
SO(r => balL(r), 15, 17, 6, 15, 2, majSpec)
//   South's lengths,  South HCP 15-17,  North HCP 6-15,  South makes 2+ calls,  North's lengths
```

**`PO(...)`: Partner opens.** It returns South's hand spec and partner's:

```js
PO(2, r => ({ s: [nmaj(r), 8, 8], p: ['bal', 15, 17, '1N'], note: 'Partner opened 1NT (15-17).' }))
//  South: no 4-card major, exactly 8 HCP.  North: balanced 15-17 that opens 1NT.
```

Lengths are written with `sp`: `sp({2: [5, 6]}, [0, 5])` means 5-6 hearts and 0-5 in each other suit. `balL(r)` is any balanced pattern, and `'bal'` means the same for partner.

To get more hands of a kind, repeat its recipe in the list. Each recipe gets an equal share of the 25 hands.

**Be aware:** changing, adding or reordering recipes changes which hands every seed deals. That is fine. The app notices, and resets unfinished progress for that set (best scores are kept). But it is why a small edit can change many hands.

A recipe that can never succeed does not freeze the app; it is skipped after 2,000 tries. The tests check that every set still deals 25 good hands.

## The page (`js/app.js`)

Everything on screen is drawn by `render()` from one state object, `S`. The views are `home()`, `play()` and `done()`. Clicking a button changes `S` and calls `render()` again.

Saved data lives in the browser under the key `bidtrainer.v2`:

```js
{ seed: { setId: 1 }, best: { setId: 23 }, prog: { setId: { seed, sig, res: [...] } } }
```

`sig` is a fingerprint of the dealt hands, so progress saved against old hands is never misread after the drills change. Damaged saved data is ignored. If something does go wrong, the page shows "Something went wrong", with buttons to go back or to reset saved progress, instead of a blank page.

## Rules of the road

- **Script order matters.** `index.html` loads `cards.js`, `rules.js`, `auction.js`, `drills.js`, then `app.js`. Each file uses names from the files before it. All of them share one global namespace, so two files must never define the same name.
- No build step and no libraries. The page works when opened straight from disk, and on GitHub Pages.
- Run the tests before you push. GitHub runs them too, and shows a red cross on the commit if they fail.
