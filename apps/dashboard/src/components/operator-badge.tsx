"use client";

import { ExternalLink } from "lucide-react";

/**
 * Discreet "who runs this instance" line at the foot of the sidebar, with the
 * way back to the operator's own dashboard.
 *
 * Renders nothing when NEXT_PUBLIC_OPERATOR_NAME is empty, which is the case
 * for a plain self-hosted install — an unattended Openship must not claim to be
 * managed by anyone. These are build-time values: they're identical across
 * every instance an operator runs.
 */
export function OperatorBadge({ collapsed }: { collapsed?: boolean }) {
  const name = process.env.NEXT_PUBLIC_OPERATOR_NAME;
  const url = process.env.NEXT_PUBLIC_OPERATOR_URL;
  if (!name) return null;

  const label = `Managed by ${name}`;

  if (!url) {
    return (
      <p
        className="mt-2 truncate px-2 text-[11px] leading-tight text-muted-foreground/70"
        title={label}
      >
        {collapsed ? name.slice(0, 2) : label}
      </p>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      className={`mt-2 flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] leading-tight text-muted-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground ${
        collapsed ? "justify-center" : ""
      }`}
    >
      {collapsed ? (
        <ExternalLink className="size-3.5" />
      ) : (
        <>
          <span className="truncate">{label}</span>
          <ExternalLink className="size-3 shrink-0" />
        </>
      )}
    </a>
  );
}
