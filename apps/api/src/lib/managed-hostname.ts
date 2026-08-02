import { env } from "../config/env";

/**
 * Composition of the free managed hostname an app gets on a self-hosted box:
 * `<label><joiner><HOST_DOMAIN>`.
 *
 * Upstream hardcodes a dot, which puts the app two labels below the base domain
 * (`myapp.acme.example.com`). An operator whose instances share ONE wildcard
 * certificate can't serve that — `*.example.com` covers a single label only.
 * With `HOST_DOMAIN_JOINER="--"` the same app lands on `myapp--acme.example.com`,
 * inside the wildcard, with no per-instance certificate to issue.
 *
 * Both directions live here: whatever composes a hostname must parse it back the
 * same way, or a managed host is mistaken for a custom one and sent to certbot.
 */
export function managedHostname(label: string, baseDomain: string): string {
  return `${label}${env.HOST_DOMAIN_JOINER}${baseDomain}`;
}

/** Suffix that identifies a hostname as managed by this instance. */
export function managedHostnameSuffix(baseDomain: string): string {
  return `${env.HOST_DOMAIN_JOINER}${baseDomain}`;
}
