# Storyloom — notes for Claude Code

Private, single-owner AI roleplay app. Independent of the Panax project in the repo root (do not mix them).
The owner is not a programmer: do the work yourself, explain simply, keep setup minimal.

## Architecture
- Ships as ONE Claude Artifact: https://claude.ai/artifact/9UXs8hWMbHHaBYMRuqEiKH (owner wants free, no hosting).
  Rebuild with `npm run build` and republish `dist/storyloom.html` to that URL
  (capabilities: sample, db, user, assets, downloads).
- `src/` React UI. `src/local/` = in-page backend: `db.ts` mirrors `server/db.ts` (sync, in memory,
  saved to the Artifact db under `data/users/<id>/root/...`), `provider.ts` = Claude via `sample`.
- `server/engine/` = story engine, shared. `vite.config.ts` swaps `server/db.ts` and
  `server/llm/provider.ts` for the `src/local/` versions in the browser build. Node tests use SQLite.
- No window.prompt/confirm/alert in the Artifact: use `src/dialog.tsx`.

## Turn pipeline (server/engine/turn.ts)
director (interprets *asterisk* text into perceived vs private, picks beats) → one streamed call per beat,
each actor sees only its own sheet + witnessed transcript (`transcriptFor`) + its memories → chronicler
(state/memories, background, under the per-session lock) → summarizer when > 50 unsummarized messages.
Knowledge boundaries are enforced by *what is sent*, not only by instructions. Keep it that way:
never put `private_note`, persona background, or other characters' secrets into an actor prompt.
Tests in `tests/engine.test.ts` check this — keep them passing.

## Rules
- DB migrations: append to `MIGRATIONS` in `server/db.ts`; never edit one that has shipped.
- Checks before pushing: `npm test`, `npm run typecheck`, `npm run build`.
- Models: `sample` tiers (default / complex); Advanced mode sends tense beats to `complex`.
