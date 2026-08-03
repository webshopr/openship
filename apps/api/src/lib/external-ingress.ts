import { ValidationError } from "@repo/core";
import { env } from "../config/env";

/**
 * The externalIngress value this instance imposes, or null when the user is
 * free to choose (upstream behaviour).
 */
export function forcedExternalIngress(): boolean | null {
  if (env.EXTERNAL_INGRESS_FORCED === "unset") return null;
  return env.EXTERNAL_INGRESS_FORCED === "true";
}

/**
 * Value to store for a NEW domain. A request that contradicts an imposed value
 * is rejected rather than silently overridden — a domain whose TLS shape isn't
 * what the user asked for fails later, somewhere the cause is invisible.
 */
export function resolveExternalIngress(requested?: boolean): boolean {
  const forced = forcedExternalIngress();
  if (forced === null) return requested ?? false;
  assertAllowed(requested, forced);
  return forced;
}

/**
 * Value to write for an EXISTING domain, or null when nothing should change.
 * An imposed value also realigns domains created before the lock was set.
 */
export function externalIngressPatch(existing: boolean, requested?: boolean): boolean | null {
  const forced = forcedExternalIngress();
  if (forced !== null) {
    assertAllowed(requested, forced);
    return existing === forced ? null : forced;
  }
  if (requested === undefined || requested === existing) return null;
  return requested;
}

function assertAllowed(requested: boolean | undefined, forced: boolean): void {
  if (requested === undefined || requested === forced) return;
  const who = env.OPERATOR_NAME || "the operator";
  throw new ValidationError(
    forced
      ? `TLS for custom domains is terminated by ${who}'s edge, which also issues the certificate — point your DNS at this instance and the domain goes live. This setting is managed for you and can't be changed here.`
      : `Certificates for custom domains are issued by this instance itself. This setting is managed by ${who} and can't be changed here.`,
  );
}
