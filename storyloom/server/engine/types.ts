export interface SceneState {
  location: string;
  time: string;
  description: string;
  /** character ids physically present with the user */
  present: string[];
}

export interface CharacterState {
  mood: string;
  /** what they are trying to achieve right now */
  goals: string[];
  /** plans already in motion (private) */
  plans: string[];
  /** private intentions toward the user or others right now */
  intentions: string;
  /** what this character knows / believes / suspects that matters (from their own perspective) */
  beliefs: string[];
  /** -10 (deep distrust) .. 10 (complete trust) */
  trust_user: number;
  /** -10 (hatred) .. 10 (deep affection) */
  affection_user: number;
  /** short note on how they see the user right now */
  user_view: string;
  /** characterId -> how they currently see that person */
  relationships: Record<string, string>;
  /** the story so far, only from this character's point of view (rolled-up older events) */
  perspective_summary: string;
}

export interface SessionState {
  scene: SceneState;
  characters: Record<string, CharacterState>;
  /** open story threads / unresolved conflicts */
  threads: string[];
}

export function emptyCharacterState(): CharacterState {
  return {
    mood: "", goals: [], plans: [], intentions: "", beliefs: [], trust_user: 0, affection_user: 0,
    user_view: "", relationships: {}, perspective_summary: "",
  };
}

export type SegmentType = "speech" | "action" | "thought" | "decision" | "observation" | "feeling" | "narration";

export interface Segment {
  /** raw text of the segment (without asterisks) */
  text: string;
  /** whether it was written inside *asterisks* */
  starred: boolean;
}

export interface ClassifiedSegment extends Segment {
  type: SegmentType;
  /** can other people in the scene perceive this? */
  observable: boolean;
}

export interface Beat {
  speaker: string; // character id or "narrator"
  /** private stage direction for this beat (never shown in chat) */
  direction: string;
  /** whether this character enters the scene right before speaking */
  enters: boolean;
  /** director flags beats that deserve deeper reasoning (used by Advanced mode) */
  complex: boolean;
}

export interface Interpretation {
  segments: ClassifiedSegment[];
  /** what others in the scene can perceive of the user's message */
  perceived: string;
  /** what stays private to the user (thoughts, secret decisions) */
  private_note: string;
  addressed: string[];
}
