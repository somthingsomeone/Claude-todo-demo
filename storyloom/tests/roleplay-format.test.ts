import { describe, expect, it } from "vitest";
import { findMentions, heuristicInterpret, splitSegments, toThirdPerson } from "../server/engine/roleplay-format.ts";

describe("splitSegments", () => {
  it("separates starred roleplay from spoken dialogue", () => {
    const s = splitSegments("*I walk into the room and notice a man standing near the window. I think he looks like an idiot.* Hi, what are you doing here?");
    expect(s).toEqual([
      { text: "I walk into the room and notice a man standing near the window. I think he looks like an idiot.", starred: true },
      { text: "Hi, what are you doing here?", starred: false },
    ]);
  });

  it("supports several starred sections and double stars", () => {
    const s = splitSegments('*I bow.* "Hello, Akari." **I glance at the door.** Shall we?');
    expect(s.map((x) => x.starred)).toEqual([true, false, true, false]);
    expect(s[1].text).toBe("Hello, Akari.");
  });

  it("treats an unclosed star as starred until the end", () => {
    expect(splitSegments("Hello. *I wave")).toEqual([{ text: "Hello.", starred: false }, { text: "I wave", starred: true }]);
  });
});

describe("heuristicInterpret — the core privacy rules", () => {
  it("the man can see me enter and hear me, but not my thought", () => {
    const r = heuristicInterpret(
      "*I walk into the room and notice a man standing near the window. I think he looks like an idiot.* Hi, what are you doing here?",
      "Ren",
    );
    expect(r.perceived).toContain("Ren walks into the room");
    expect(r.perceived).toContain('"Hi, what are you doing here?"');
    expect(r.perceived.toLowerCase()).not.toContain("idiot");
    expect(r.private_note.toLowerCase()).toContain("idiot");
  });

  it("smile is visible, secret hatred is not", () => {
    const r = heuristicInterpret("*I smile politely, although I secretly hate him.* It's nice to meet you.", "Ren");
    expect(r.perceived).toMatch(/Ren smiles politely/);
    expect(r.perceived).toContain("It's nice to meet you.");
    expect(r.perceived.toLowerCase()).not.toContain("hate");
    expect(r.private_note.toLowerCase()).toContain("hate");
  });

  it.each([
    ["*I wonder whether she is lying to me.*", "thought"],
    ["*I secretly decide not to trust him.*", "decision"],
    ["*I slowly open the door.*", "action"],
  ])("%s -> %s", (input, type) => {
    const r = heuristicInterpret(input, "Ren");
    expect(r.segments[0].type).toBe(type);
    expect(r.segments[0].observable).toBe(type === "action");
  });

  it("plain dialogue needs no stars", () => {
    const r = heuristicInterpret("Hello, Akari.", "Ren");
    expect(r.segments).toEqual([{ text: "Hello, Akari.", starred: false, type: "speech", observable: true }]);
    expect(r.private_note).toBe("");
  });
});

describe("mentions and person rewrite", () => {
  it("finds @mentions by full or first name", () => {
    const cast = [{ id: "a", name: "Akari Tanaka" }, { id: "b", name: "Lord Hideyoshi" }];
    expect(findMentions("@Akari what do you think? @lord hideyoshi?", cast).sort()).toEqual(["a", "b"]);
    expect(findMentions("akari, hello", cast)).toEqual([]);
  });

  it("rewrites first person actions to third person", () => {
    expect(toThirdPerson("I slowly open the door and step inside", "Ren")).toBe("Ren slowly opens the door and steps inside");
    expect(toThirdPerson("I bow to my host", "Ren")).toBe("Ren bows to their host");
  });
});
