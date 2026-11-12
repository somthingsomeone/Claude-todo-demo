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

### Option A: online, for your phone (recommended)

This uses **Railway** (about $5/month). It needs no command line.

1. Get an Anthropic API key:
   1. Go to **console.anthropic.com** and sign up.
   2. Open **Billing** and add some credit.
   3. Open **API Keys**, click **Create Key** and copy the key.
2. Go to **railway.com** and sign in with GitHub.
3. Click **New Project → Deploy from GitHub repo** and pick this repository.
4. Click the new service and open **Settings**:
   - **Source → Root Directory:** type `storyloom`
   - **Source → Branch:** choose the branch that contains Storyloom
5. Open the **Variables** tab and add:
   - `APP_PASSWORD`: a long password that only you know (required)
   - `ANTHROPIC_API_KEY`: your key (optional; you can also paste it later in the app's Settings)
6. Right-click the service, choose **Attach Volume**, and set the mount path to `/data`.
   **This is what keeps your stories and images safe across restarts.**
7. Go to **Settings → Networking** and click **Generate Domain**. This gives you your private web address.
8. On your iPhone, open that address in Safari, log in, then tap **Share → Add to Home Screen**. The app opens full screen like a normal app.

### Option B: on your own computer

You need Node.js 22.13 or newer.

```bash
cd storyloom
npm install
npm run build
npm start
```

Open http://localhost:8787. Without `APP_PASSWORD` the app is open to anyone who can reach it, so only do this on your own computer. You can put the settings in a `.env` file (see `.env.example`).

## Costs

There is no subscription. You pay Anthropic per use, and **each story shows its running cost** in its ⋯ menu.

| Mode | Typical cost per message (Claude Opus 5.5) |
|---|---|
| Normal | about $0.05–0.15 |
| Advanced | roughly 2–4× Normal on tense turns |

To spend less, go to Settings and switch the *Helper* model to Claude Haiku 5.5. It is much cheaper and handles the bookkeeping well. You can also switch the *Storyteller* model to Sonnet 5.5, which costs about half as much.

## Your data

- Everything is stored in one folder (`DATA_DIR`):
  - `storyloom.db` holds all text
  - `uploads/` holds the images
- To back up, copy that folder. On Railway, open **Volume → Backups**.
- Your text is sent only to Anthropic, to generate replies. The API key stays on the server and never reaches the browser.

## Developer notes

- **Stack:** Express and React (Vite), with SQLite built into Node (`node:sqlite`), on a single server.
- **Checks:** `npm test`, `npm run typecheck` and `npm run build`.
- **Live AI behaviour test:** `ANTHROPIC_API_KEY=... npm run test:live`. It runs eight realistic scenarios:
  - private thoughts stay private
  - hidden hatred is not revealed
  - a proud character refuses an unreasonable order
  - a manipulator does not confess
  - a strategist spots a contradiction
  - an absent character doesn't know what was said
  - a kind character keeps her boundary
  - a multi-character scene plays out correctly

  The model grades each scenario. One run costs about $1.
- **Providers:** `server/llm/provider.ts` is the provider interface. To add another AI provider, implement `LLMProvider`.
- **Prompts:** all prompt text is in `server/engine/prompts.ts`.
