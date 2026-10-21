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
8. **Opposite opener's 18-19 2NT rebid, responder bids 3NT with 7+**, whether the first response was a suit or 1NT (18 + 7 = 25). Before 2026-10-21 the code said 7+ after 1m – 1M – 2NT but 8+ after 1m – 1NT – 2NT; one threshold had to give, and 7 matches the 25-point rule. If the chart says 8 after 1NT, change it back in `after1Minor`. (`after1Minor`, `respAfterRebid`)
9. **"New suit first, then support" (3-card support, 13+).** When opener's rebid shows a minimum (1NT, 2NT after a 2-level response, a rebid of the major, or a new suit below the barrier), responder with 13-16 now bids game in opener's major. With 17+ (opposite a minimum), or when opener shows extra values, the auction stops, as there is no slam route in the chart. If opener raises responder's new suit, responder treats it as a normal raise (so 1♥ – 1♠ – 2♠ – 4♠). The 16 cut-off is the same trainer guide as after Jacoby (at most 30 combined). (`supportAfterNewSuit`)

## Gaps: the chart gives no next call, so the auction stops

When an auction stops, the drill now shows the reason written in the code (the text of the `gap(…)` or `amb(…)`), so these gaps are visible to users too.

10. **Opener's answer to an invitation**, in several auctions:
   - 1M – new suit – 2M (simple raise) – 3M (invite)
   - 1m – 1M – 1NT – 2NT
   - 1NT – 2♣ – 2♥ – 2NT when opener also holds four spades
   - 1NT – 2♦/2♥ – 2M – 2NT when opener has 3-card support
11. **1m – 1NT with a balanced 12-14 opener.** The obvious call is pass, but the chart gives none, so these hands are never dealt to South as opener.
12. **1M – 1NT.** Opener has no rebid at all, so this auction always stops after the response.
13. **Opener with 13-14 after a limit raise** (1M – 3M). This one is already noted in the README.
14. **After Jacoby 2NT, if opener shows shortness or a 5-card side suit** (3x or 4x), responder has no next call.
15. **2♣ – 2♦ – (a suit).** Responder has no next call. Responder also has none after a positive response to 2♣. (2♣ – 2♦ – 3NT now ends with responder's automatic pass.)
16. **No passed-hand auctions.** If South passes and partner would open, the auction stops: the chart has no rules for responding as a passed hand (Drury, no Jacoby 2NT, and so on). The "too weak to open" drill avoids this by giving partner a hand that also passes.
17. **No responses to weak 2♦ or to pre-empts** (3-level and 4-level openings), so those auctions stop after the opening.
18. **Contested auctions after the first call.** Chart F covers only the first call over an opponent's opening. Opponents always pass in the whole-auction drills, so this only matters once they start bidding (see ROADMAP).
19. **RKCB:**
    - With all five key cards, there is no reply. The trainer used to answer 5♦ "1 or 4", which was wrong; it now stops.
    - After 5NT there is no king-ask reply.
    - When the reply is ambiguous to the asker (for example 5♣ = 0 or 3 while holding 2), the auction stops.

## Already fixed in this review

- **1NT – 2♠ (range-ask) with 8 HCP and a six-card minor.** Responder used to treat this hand as the weak long-minor sign-off, bidding "3♦ to play" opposite a 17-count. It now passes 2NT, or bids 3NT opposite 3♣, as the range-ask explanation promised.
- **Explanations that misdescribed the hand.** "Six hearts" was shown for seven-card suits, "no long suit" for a hand with a five-card suit, and "With 12 (11-12)" for an opener who must hold exactly 12.
- **Responder forgot the support they had promised.** With 3-card support and 13+, responder bids a new suit "then support", but then bid 3NT over opener's 1NT (missing the 5-3 major fit), or had no call at all after other minimum rebids. See reading 9 above.
- **Two thresholds for the same 2NT rebid.** See reading 8 above.
- **Game auctions that never ended.** 1♥ – 1♠ – 2♠ – 4♠, 1NT – 2NT – 3NT, 1NT – 4NT – 6NT and 2♣ – 2♦ – 3NT stopped without a final contract. The obvious pass is now automatic, so they show "Final contract".
