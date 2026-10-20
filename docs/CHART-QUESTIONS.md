# Open questions about the chart

These are places where the code is consistent with itself, but the bridge is worth checking against the written chart. Some are choices that differ from common practice; others are gaps, where the chart gives no next call so the auction just stops. None of them crash anything.

For each one, either confirm it ("the chart says so") or change the rule in `js/rules.js` / `js/auction.js` and add a test for it.

## Readings that differ from common practice

1. **5-5 in the majors opens 1♥.** Most 5-card-major systems open 1♠ with 5-5, planning to bid hearts next. (`openingBid`)
2. **1M – 3♦ = 4+ trumps 7-9, and 1M – 3♣ = 4+ trumps 10-12.** This is reverse Bergen; standard Bergen is the other way round. (`r1M`)
3. **2NT – 3♣ – 3♥: responder with four spades bids 3NT.** Opener could also hold four spades, so a 4-4 spade fit can be missed. The 1NT version handles this (1NT – 2♣ – 2♥ – 2♠); the 2NT version does not. (`nt2`)
4. **1♥ – (1♠) – X shows both minors, even with heart support.** The drill deals responder 0-6 hearts, so some hands that would normally raise hearts are taught to double. (`negDbl`, `NEG` in drills.js)
5. **Advancing a takeout double with 12+ and a long minor bids 5 of the minor**, never 3NT. (`advance`)
6. **A 5-card weak raise (1M – 4M) is taught even with 0 HCP.** (`r1M`)
7. **Responding to 1♣ with four diamonds and a 4-card major bids 1♦** (up the line), not the major. (`r1m`)

## Gaps: the chart gives no next call, so the auction stops

8. **Opener's answer to an invitation**, in several auctions:
   - 1M – new suit – 2M (simple raise) – 3M (invite)
   - 1m – 1M – 1NT – 2NT
   - 1NT – 2♣ – 2♥ – 2NT when opener also holds four spades
   - 1NT – 2♦/2♥ – 2M – 2NT when opener has 3-card support
9. **1m – 1NT with a balanced 12-14 opener.** The obvious call is pass, but the chart gives none, so these hands are never dealt to South as opener.
10. **1M – 1NT.** Opener has no rebid at all, so this auction always stops after the response.
11. **Opener with 13-14 after a limit raise** (1M – 3M). This one is already noted in the README.
12. **After Jacoby 2NT, if opener shows shortness or a 5-card side suit** (3x or 4x), responder has no next call.
13. **2♣ – 2♦ – 3NT, and 2♣ – 2♦ – (a suit).** Responder has no next call. Responder also has none after a positive response to 2♣.
14. **No responses to weak 2♦ or to pre-empts** (3-level and 4-level openings), so those auctions stop after the opening.
15. **RKCB:**
    - With all five key cards, there is no reply. The trainer used to answer 5♦ "1 or 4", which was wrong; it now stops.
    - After 5NT there is no king-ask reply.
    - When the reply is ambiguous to the asker (for example 5♣ = 0 or 3 while holding 2), the auction stops.

## Already fixed in this review

- **1NT – 2♠ (range-ask) with 8 HCP and a six-card minor.** Responder used to treat this hand as the weak long-minor sign-off, bidding "3♦ to play" opposite a 17-count. It now passes 2NT, or bids 3NT opposite 3♣, as the range-ask explanation promised.
- **Explanations that misdescribed the hand.** "Six hearts" was shown for seven-card suits, "no long suit" for a hand with a five-card suit, and "With 12 (11-12)" for an opener who must hold exactly 12.
