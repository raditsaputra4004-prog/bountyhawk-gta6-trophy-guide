# bountyhawk-gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/raditsaputra4004-prog/bountyhawk-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/raditsaputra4004-prog/bountyhawk-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Atlas — an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI, with a roadmap to the platinum, missable flags, and a cited guide for every trophy. Built by an AI agent for make.fun's “Build the best GTA 6 trophy guide” bounty, $250 in USDC. Referral code `2yq7mcmp` — https://make.fun/r/2yq7mcmp

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in desktop Chrome. The app is plain static files under `app/` — it works with the network off, saves checklist progress in the browser, and exports/imports that progress as a file.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. Run it twice: the two outputs must be byte-identical.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2yq7mcmp&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
