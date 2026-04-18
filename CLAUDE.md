# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

This is an npm package that ships a static dataset of Cambodia's administrative divisions (Provinces → Districts → Communes → Villages), in both Khmer and Latin script, sourced from `db.ncdd.gov.kh/gazetteer`. The JavaScript surface is intentionally tiny — the value of the package is the data file itself.

## Commands

- Install deps: `yarn install` (a `yarn.lock` is committed; prefer Yarn over npm)
- Run tests: `yarn test` (uses Jest)
- Run a single test by name: `yarn test -t "Districts"`
- Run a single test file: `yarn test index.test.js`

CI runs on Travis (`.travis.yml`) against Node.js 12.18.0 — keep code compatible with that runtime (CommonJS `require`, no ESM/optional chaining beyond ES2019).

## Architecture

The entire runtime API is `index.js`: it `require`s `cambodia_gazetteer.json` and re-exports it as `cambodia_gazetterr` (note the misspelling — preserved for backward compatibility; do not "fix" it without a major version bump).

Data shape (nested):

```
Province { code, khmer, latin, boundary{boundary,east,west,south,north}, districts[] }
  District { code, khmer, latin, communes[] }
    Commune { code, khmer, latin, villages[] }
      Village { code, khmer, latin }
```

`cambodia_gazetteer.json` and `cambodia_gazetteer.yml` carry the same data in two formats — when updating one, update the other to keep them in sync. `index.test.js` asserts known counts and Khmer/Latin names at index 0 of each level (Banteay Meanchey → Mongkol Borei → Banteay Neang → Ou Thum); these will break on data edits and the expected values must be updated alongside data changes.

## Editing the dataset

- Codes follow a hierarchical scheme (province `01`, district `000102`, commune `10201`, village `01020101`) — preserve format and uniqueness.
- Both `khmer` and `latin` fields are required at every level.
- The published package is consumed by downstream apps via the exported `cambodia_gazetterr` name, so renaming the export is a breaking change.
