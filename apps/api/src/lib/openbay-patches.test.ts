import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Guards for the changes this fork carries on top of upstream.
 *
 * They assert the EFFECT, never the presence of a line of code: an upstream
 * update can merge without a conflict and still leave a patch inert (a renamed
 * helper, a moved call site, a default re-applied elsewhere). A silently dead
 * patch is the failure mode to catch — it hands clients failing certificates
 * and apps that won't boot, with nothing in the logs saying why.
 *
 * `env` is parsed once at module load, so each case re-imports through
 * `vi.resetModules()` with the environment it needs.
 */

const BASE_ENV = {
  INTERNAL_TOKEN: "test-internal-token-0000000000000000000000000000",
};

async function load(vars: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...vars })) {
    vi.stubEnv(key, value);
  }
  return {
    hostname: await import("./managed-hostname"),
    ingress: await import("./external-ingress"),
  };
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("free managed hostname", () => {
  it("keeps the upstream dot when no joiner is configured", async () => {
    const { hostname } = await load({});
    expect(hostname.managedHostname("blog", "example.com")).toBe("blog.example.com");
  });

  it('composes one label under a shared wildcard with "--"', async () => {
    const { hostname } = await load({ HOST_DOMAIN_JOINER: "--" });
    // The whole point: `*.openbay.run` covers this, `blog.acme.openbay.run` not.
    expect(hostname.managedHostname("blog", "acme.openbay.run")).toBe("blog--acme.openbay.run");
  });

  it("parses back what it composed", async () => {
    const { hostname } = await load({ HOST_DOMAIN_JOINER: "--" });
    const composed = hostname.managedHostname("blog", "acme.openbay.run");
    expect(composed.endsWith(hostname.managedHostnameSuffix("acme.openbay.run"))).toBe(true);
  });

  it("rejects a joiner that isn't a valid hostname separator", async () => {
    await expect(load({ HOST_DOMAIN_JOINER: "_" })).rejects.toThrow();
  });
});

describe("imposed external ingress", () => {
  it("leaves the choice alone when unset", async () => {
    const { ingress } = await load({});
    expect(ingress.forcedExternalIngress()).toBeNull();
    expect(ingress.resolveExternalIngress(undefined)).toBe(false);
    expect(ingress.resolveExternalIngress(true)).toBe(true);
  });

  it("imposes its value on a new domain", async () => {
    const { ingress } = await load({ EXTERNAL_INGRESS_FORCED: "true" });
    expect(ingress.resolveExternalIngress(undefined)).toBe(true);
    expect(ingress.resolveExternalIngress(true)).toBe(true);
  });

  it("refuses a contradicting request instead of overriding it silently", async () => {
    const { ingress } = await load({ EXTERNAL_INGRESS_FORCED: "true", OPERATOR_NAME: "Openbay" });
    expect(() => ingress.resolveExternalIngress(false)).toThrow(/Openbay/);
  });

  it("realigns a domain created before the lock, and no-ops otherwise", async () => {
    const { ingress } = await load({ EXTERNAL_INGRESS_FORCED: "true" });
    expect(ingress.externalIngressPatch(false, undefined)).toBe(true);
    expect(ingress.externalIngressPatch(true, undefined)).toBeNull();
  });
});
