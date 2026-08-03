# Openbay fork

What this fork changes on top of upstream Openship, and why. `upstream.txt` records
the tag we're merged up to.

**Rule:** behaviour lives in its own module, upstream files get only the call site.
Every patch is guarded by an *effect* test in `apps/api/src/lib/openbay-patches.test.ts`
— a patch that goes inert during a merge has to fail CI, not ship silently.

## 1. Free-host joiner — `HOST_DOMAIN_JOINER`

**Why:** every instance shares ONE wildcard certificate (`*.openbay.run`), and a
wildcard covers a single label. Upstream's `myapp.acme.openbay.run` sits two labels
deep, so it can't be served without issuing a certificate per instance.

**How:** `apps/api/src/lib/managed-hostname.ts` composes `<label><joiner><HOST_DOMAIN>`
and parses it back the same way — compose and parse must agree, or a managed host is
mistaken for a custom one and sent to certbot. Default `.` leaves upstream behaviour
untouched; Openbay sets `--`, giving `myapp--acme.openbay.run`.

## 2. Imposed external ingress — `EXTERNAL_INGRESS_FORCED`

**Why:** behind the Openbay edge, which owns port 80 and terminates TLS, certbot can
never answer an ACME challenge — a custom domain would stay pending forever. Offering
the choice is offering a trap, so the operator pins it and the dashboard explains it.

**How:** `apps/api/src/lib/external-ingress.ts` decides the stored value. `unset` keeps
upstream behaviour (per-domain choice). A request that contradicts the imposed value is
**rejected**, never silently overridden. This needs `externalIngress` to reach
`addDomain` as `undefined` — hence the missing `default: false` in the schema.

## 3. Operator identity — `OPERATOR_NAME` / `OPERATOR_URL`

**Why:** an operator-run instance has to say who runs it and explain the settings decided
on the user's behalf. A plain self-hosted install must look completely untouched.

**How:** baked at build time (`NEXT_PUBLIC_*` is inlined by Next), via Dockerfile build
args. `apps/dashboard/src/lib/operator.ts` + `operator-badge.tsx`. Empty values → nothing
appears anywhere. Deliberately not routed through the i18n catalog: adding keys to every
locale file would conflict with upstream on each update.

## 4. CI

- `openbay-sync.yml` — daily merge of the newest upstream stable tag. Stops on a conflict,
  failed patch assertions or a failed typecheck, and reports to the job summary (plus an
  issue when the repo has them enabled).
- `openbay-images.yml` — builds our images into our own GHCR namespace. Triggered by
  `openbay-v*`, never `v*.*.*`, so upstream's `docker-images.yml` stays byte-identical
  and dormant, and never conflicts on a merge.

## Patched upstream files

These are the call sites — the only places a merge can conflict.

| File | What we changed |
| --- | --- |
| `apps/api/src/config/env.ts` | the three env vars above |
| `apps/api/src/lib/routing-domains.ts` | joiner inside `resolveServiceEndpointHostname`, suffix in `resolveManagedHostname` |
| `apps/api/src/modules/deployments/preflight.ts` | 5 hostname compositions routed through `managedHostname` |
| `apps/api/src/modules/domains/domain.service.ts` | `resolveExternalIngress` / `externalIngressPatch`, joiner-aware suffix |
| `apps/api/src/modules/domains/domain.schema.ts` | no `default: false` on `externalIngress` |
| `apps/api/src/modules/projects/project.controller.ts` | `externalIngress` left `undefined` |
| `apps/dashboard/Dockerfile` | operator build args |
| `apps/dashboard/src/components/sidebar.tsx` | operator badge |
| `apps/dashboard/.../components/DomainSettings.tsx` | notice instead of a toggle when the value is imposed |

## Known gap

`apps/api/src/lib/public-endpoints.ts` keeps its own private copy of the managed-host
suffix with a hardcoded dot. With a `--` joiner it classifies a managed host as a custom
one. Predates the patches and is not covered by the guard test.
