import { getPlot, getPlotCharacters, insertMessage, insertSession, newId, type SessionRow } from "../db.ts";
import { emptyCharacterState, type SessionState } from "./types.ts";

/** Start a new save slot for a plot: initial scene, cast present, and the opening scenario as narration. */
export function createSession(plotId: string, title?: string): SessionRow {
  const plot = getPlot(plotId);
  if (!plot) throw new Error("Plot not found.");
  const pcs = getPlotCharacters(plotId);
  const present = pcs.filter((p) => p.starts_present).map((p) => p.character_id);
  const state: SessionState = {
    scene: { location: plot.start_location || "", time: "", description: "", present },
    characters: Object.fromEntries(pcs.map((p) => [p.character_id, emptyCharacterState()])),
    threads: [],
  };
  const session = insertSession({
    id: newId("s_"), plot_id: plotId, title: title?.trim() || "Main Story",
    speaker_mode: "auto", intelligence: "normal", state, summary: "", summarized_upto: 0,
  });
  if (plot.scenario.trim()) {
    insertMessage({
      session_id: session.id, kind: "narration", character_id: null, content: plot.scenario.trim(),
      perceived: null, private_note: null, witnesses: present, turn_id: null,
    });
  }
  return session;
}
