"use client";

import { useSearchParams } from "next/navigation";

/** Shows the ?msg= / ?err= message left by an admin action. */
export function Flash() {
  const params = useSearchParams();
  const msg = params.get("msg");
  const err = params.get("err");
  if (err)
    return (
      <p className="flash flash--err" role="alert">
        {err}
      </p>
    );
  if (msg)
    return (
      <p className="flash flash--ok" role="status">
        {msg}
      </p>
    );
  return null;
}
