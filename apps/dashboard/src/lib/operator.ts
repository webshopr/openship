/**
 * What the instance's operator has decided on the user's behalf.
 *
 * Build-time values: they're identical across every instance a given operator
 * runs, so they ride in the image rather than through the API. All of them are
 * absent on a plain self-hosted install, where the user IS the operator and
 * nothing here should show up.
 *
 * Deliberately NOT routed through the i18n catalog: these strings only exist in
 * an operator-run build, and adding keys to every locale file would collide
 * with upstream on each update.
 */

/** The externalIngress value the operator imposes, or null when free to choose. */
export function forcedExternalIngress(): boolean | null {
  const value = process.env.NEXT_PUBLIC_EXTERNAL_INGRESS_FORCED;
  if (value !== "true" && value !== "false") return null;
  return value === "true";
}

export function operatorName(): string {
  return process.env.NEXT_PUBLIC_OPERATOR_NAME || "";
}

/** Explains the imposed TLS shape where the toggle used to be. */
export function externalIngressNotice(forced: boolean): string {
  const who = operatorName() || "your host";
  return forced
    ? `TLS is terminated by ${who}'s edge, which issues the certificate for you — add the domain here, point its DNS at this instance, and it goes live.`
    : `Certificates are issued by this instance itself — ${who} manages this setting.`;
}
