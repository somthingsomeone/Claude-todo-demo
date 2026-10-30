"use server";

import { headers } from "next/headers";
import { getDb } from "@/lib/db/client";
import { FormError, submitCorrection } from "@/lib/data/corrections";
import { LIMITS, clientIp, rateLimit } from "@/lib/rate-limit";

export type CorrectionState = { ok: boolean; error?: string };

export async function sendCorrection(_prev: CorrectionState, fd: FormData): Promise<CorrectionState> {
  try {
    const db = await getDb();
    if (!(await rateLimit(db, "correction", clientIp(await headers()), LIMITS.correction))) {
      return { ok: false, error: "أرسلت طلبات كثيرة. حاول مرة ثانية بعد ساعة." };
    }
    await submitCorrection(db, Object.fromEntries(fd.entries()));
    return { ok: true };
  } catch (e) {
    if (e instanceof FormError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "صار خطأ غير متوقع. جرّب مرة ثانية." };
  }
}
