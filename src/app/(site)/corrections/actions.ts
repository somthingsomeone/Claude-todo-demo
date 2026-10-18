"use server";

import { getDb } from "@/lib/db/client";
import { FormError, submitCorrection } from "@/lib/data/corrections";

export type CorrectionState = { ok: boolean; error?: string };

export async function sendCorrection(_prev: CorrectionState, fd: FormData): Promise<CorrectionState> {
  try {
    await submitCorrection(await getDb(), Object.fromEntries(fd.entries()));
    return { ok: true };
  } catch (e) {
    if (e instanceof FormError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "صار خطأ غير متوقع. جرّب مرة ثانية." };
  }
}
