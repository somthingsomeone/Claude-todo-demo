# Storyloom: private AI roleplay

A private website for multi-character roleplay stories. It works on iPhone, iPad and desktop.
Characters are played by Claude (Anthropic). Each character has its own goals and only knows what it could have seen or heard.

## What it does

- **Plots.** Each plot is a separate world with a cover, setting, lore, an opening scenario, a cast and your persona. You can create, edit, duplicate and delete plots.
- **Characters.** Each character has a portrait and the full set of profile fields (personality, intelligence, motives, values, fears, relationships, secrets, voice, example dialogue, custom instructions) plus reference images. You can reuse a character in several plots. Their memories stay separate in each plot.
- **Personas.** These are the characters you play, and each plot can use a different one. The AI never writes your persona's words, actions or thoughts.
- **Saves.** A plot can have many saves (for example "Main Story", "Alternate Timeline" or "New Beginning"). **Branch** copies a save, including its history, memories and relationships, so you can try a different choice.
- **Chat.** It includes:
  - streaming replies, Stop, Retry (regenerate) and Continue (the scene moves on without you)
  - editing and deleting messages
  - @mentions and search
  - Auto or Manual choice of who responds
  - Normal or Advanced intelligence
- **Memory panel** (brain button). For each save you can see and correct:
  - the current scene and who is present
  - each character's mood, trust, affection, goals, secret plans and beliefs
  - their view of the other characters
  - the important memories, including which characters know each one
  - the story outline

### How to write

| You type | Meaning | Who knows it |
|---|---|---|
| `*I open the door.*` | a visible action | everyone present |
| `*I think she's lying.*` | a private thought | **only you** |
| `*I smile, although I secretly hate him.*` | the smile is visible; the hatred is private | split automatically |
| `Hello, Akari.` | spoken aloud | everyone in earshot |
| `@Akari` | speaks directly to Akari | — |

Tap the 🔒 on one of your messages to see exactly what the characters perceived.

## How the AI works (the short version)

Every message goes through these steps:

1. **Director.** One AI call reads your message. It separates what others can see and hear from your private thoughts, and it decides who reacts. That can be one character, several, the narrator, or nobody.
2. **Actors.** Each character who reacts gets **their own AI call**. That call contains only:
   - their own character sheet, including their secrets
   - their own memories and inner state
   - the conversation **as they witnessed it**, with your private thoughts removed

   Your private thoughts, other characters' secrets and events they missed are never sent to them, so they cannot leak.
   Before replying, each character privately thinks about what they want, what they know and what the risks are. That thinking is never shown.
3. **Chronicler.** In the background, one call updates the scene, who is present, each character's trust, affection, goals and plans, and the important memories. Trust changes gradually, and a character only remembers events they witnessed.
4. **Summaries.** In long stories, older messages are condensed into an overall outline plus one version per character, written from that character's point of view.

**Advanced mode** uses the same steps but with deeper reasoning. Characters only think much longer in tense moments (deception, negotiation, confrontation), so simple moments stay fast and cheap. It costs roughly 2–4× more and can take 10–40 seconds before a difficult reply starts. It improves consistency but does not guarantee it.

## Run it

Storyloom is a **Claude Artifact**: https://claude.ai/artifact/9UXs8hWMbHHaBYMRuqEiKH

- It has no website, server or API key, and there is no extra bill.
- The AI runs on your own Claude plan and counts toward its normal usage limits.
- The first time a story runs, Claude asks you to **Allow** it.
- Everything is saved inside the Artifact, in your private space.
- Download a backup any time from Settings.

## Developer notes

- **Stack:** React (Vite), built into one HTML file (`npm run build` → `dist/storyloom.html`).
  - The AI runs through the Artifact `sample` capability, on the viewer's Claude account.
  - Storage uses the Artifact `db` capability (private `data/users/<id>/` subtree), plus `assets` for images.
  - `src/local/` is the in-page backend.
  - The story engine in `server/engine/` is shared with the Node tests (which run on SQLite).
- **Checks:** `npm test`, `npm run typecheck` and `npm run build`.
- **Providers:** `server/llm/provider.ts` is the provider interface. The Artifact version is `src/local/provider.ts`.
- **Prompts:** all prompt text is in `server/engine/prompts.ts`.
