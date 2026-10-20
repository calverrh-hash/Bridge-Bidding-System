# Strong NT Bidding Trainer

Practice bidding drills for a 5-card majors / strong 1NT (15-17) system. You sit South and bid whole auctions. Partner is dealt a real hand and bids by the same chart.

## Run it

Open `index.html` in a browser. No install or build step is needed.

In VS Code, install the **Live Server** extension (by Ritwick Dey) to reload the page every time you save. Then right-click `index.html` and choose **Open with Live Server**.

## Put it online with GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. After a minute the trainer is live at `https://<your-username>.github.io/<repo-name>/`.

## Where things live

| File | What it holds |
|---|---|
| `js/rules.js` | The flowchart rules for one call: openings, responses to 1NT/1M/1m, opener's rebid, competitive bids, 2NT/2♣/weak twos, Jacoby and RKCB. Change a range or a convention here. |
| `js/auction.js` | Carries an auction forward call by call (`sysCall`), so both partners keep bidding until the chart stops. |
| `js/drills.js` | The drill sets. Each recipe deals a type of hand for one drill. Add a recipe to get more hands of that kind. |
| `js/app.js` | The page: home screen, bidding box, feedback, results and saved progress. |
| `style.css` | Colours (light and dark), type and layout. |

Each answer's explanation is written next to its rule, as the second argument of `R(bid, why, chartSection)`.

## Notes on chart readings

- Hands where the chart allows more than one call are not dealt, so every answer is unambiguous.
- Auctions end where the chart gives no next step (for example, opener with 13-14 after a limit raise, or cue-bidding after Jacoby).
- After Jacoby 2NT the trainer asks for key cards with about 31+ combined points. This is a trainer guide, not part of the chart.
- Over a 2NT transfer, "4M with 4-5" is read as 4-5 HCP.

Progress is saved in the browser (localStorage), so each person keeps their own scores.
