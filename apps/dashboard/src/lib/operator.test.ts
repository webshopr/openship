import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Same intent as apps/api/src/lib/openbay-patches.test.ts: assert the effect of
 * this fork's dashboard changes, so an upstream update that merges cleanly but
 * neuters them fails here instead of in front of a client.
 */

async function load() {
  vi.resetModules();
  return import("./operator");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("operator identity", () => {
  it("says nothing on a plain self-hosted install", async () => {
    const { operatorName, forcedExternalIngress } = await load();
    expect(operatorName()).toBe("");
    expect(forcedExternalIngress()).toBeNull();
  });

  it("reports the imposed ingress value and names the operator", async () => {
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_NAME", "Openbay");
    vi.stubEnv("NEXT_PUBLIC_EXTERNAL_INGRESS_FORCED", "true");
    const { operatorName, forcedExternalIngress, externalIngressNotice } = await load();
    expect(operatorName()).toBe("Openbay");
    expect(forcedExternalIngress()).toBe(true);
    expect(externalIngressNotice(true)).toContain("Openbay");
  });

  it("treats a junk value as no lock rather than as false", async () => {
    vi.stubEnv("NEXT_PUBLIC_EXTERNAL_INGRESS_FORCED", "yes");
    const { forcedExternalIngress } = await load();
    expect(forcedExternalIngress()).toBeNull();
  });
});
