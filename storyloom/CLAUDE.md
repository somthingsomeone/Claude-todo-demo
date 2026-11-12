# Storyloom — notes for Claude Code

Private, single-owner AI roleplay app. Independent of the Panax project in the repo root (do not mix them).
The owner is not a programmer: do the work yourself, explain simply, keep setup minimal.

## Architecture
- `server/` Express + `node:sqlite` (one DB file in `DATA_DIR`, images in `DATA_DIR/uploads`). Run with `tsx`.
- `src/` React SPA (Vite). Built into `dist/` and served by the same server.
- Auth: `APP_PASSWORD` → signed HttpOnly cookie. Required when `NODE_ENV=production`.
- AI: `server/llm/` (provider interface + Anthropic). API key from `ANTHROPIC_API_KEY` or Settings (server-side only).

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
- `npm run test:live` needs a real key and costs ~$1.
- `tests/e2e-server.ts` is a scripted AI for UI tests only; never wire it into the real app.
- Default models: claude-opus-5-5 (configurable in Settings).
