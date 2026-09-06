# World Cel-Shading Outline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable scene-wide inverted-hull second pass that draws configurable mesh borders in the World lobby, including avatars, while preserving existing materials, colors, and lighting.

**Architecture:** `CelShadingRenderer` observes Babylon's real mesh/group rendering lifecycle. It queues eligible opaque and alpha-test `SubMesh` draws from the main render pass, then replays them once after opaque depth is complete and before particles/transparent meshes. Babylon's registered `OutlineRenderer` supplies the normal-expansion shader and geometry feature support, while the new renderer owns scheduling, front-face culling, per-mesh settings, state restoration, and lifecycle.

**Tech Stack:** TypeScript, Babylon.js 9.19 (`@babylonjs/core/pure.js` in production and `NullEngine` in tests), Vitest 4.1.10, pnpm workspace.

## Global Constraints

- Apply only to `WorldEngine` (the lobby); do not instantiate the renderer in `RoomEngine` or preview engines.
- Include avatar meshes automatically because defaults enable every eligible lobby-scene mesh.
- Exclude the lobby skybox explicitly.
- Do not create duplicate outline meshes and do not set `mesh.renderOutline = true`.
- Do not alter the original material, lighting, shadows, or base color pass.
- Default outline is black and `cm(1)` wide. Per-mesh `enabled`, `color`, and `width` overrides are public.
- Skip alpha-blended, normal-less, non-triangle, disposed, or disabled meshes.
- Limit automated verification to `frontend-misskey-world-engine` Vitest tests. Per user instruction, do not run visual validation, whole-repository type checks, package type checks, or lint.
- New TypeScript files must carry the AGPL SPDX header.
- Use the system Node 26 executable for pnpm in this workspace if the default pnpm shim selects Node 24.

---

### Task 1: Add a targeted renderer test harness and lock down render ordering

**Files:**

- Modify: `packages/frontend-misskey-world-engine/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `packages/frontend-misskey-world-engine/vitest.config.ts`
- Create: `packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts`
- Create: `packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts`

- [ ] Add a package-local `test` script and Vitest dependency:

```json
"test": "vitest run --config vitest.config.ts"
```

```json
"vitest": "4.1.10"
```

- [ ] Configure only this package's tests:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['./test/**/*.test.ts'],
		environment: 'node',
	},
});
```

- [ ] Write the first test before the production module exists. Dynamically import the desired API so the missing module becomes an intentional assertion failure, then build a real Babylon `NullEngine` scene containing one opaque and one alpha-blended box. The observable event contract is:

```ts
expect(events).toEqual(['opaque', 'outline:opaque', 'transparent']);
```

The injected outline delegate records the outline event, but the real Babylon scene, materials, render groups, and mesh callbacks determine the ordering.

- [ ] Run only this test and confirm RED because `CelShadingRenderer` is absent:

```powershell
pnpm --filter frontend-misskey-world-engine test -- test/CelShadingRenderer.test.ts
```

Expected: one failed assertion explaining that the renderer module has not been implemented.

- [ ] Create `CelShadingRenderer.ts` with the public API and lifecycle skeleton:

```ts
export type CelShadingMeshOptions = {
	enabled: boolean;
	color: BABYLON.Color3;
	width: number;
};

export class CelShadingRenderer implements BABYLON.ISceneComponent {
	public readonly name = 'CelShadingRenderer';
	public readonly scene: BABYLON.Scene;

	public constructor(scene: BABYLON.Scene, options?: CelShadingRendererOptions) {}
	public setMeshOptions(mesh: BABYLON.Mesh, options: Partial<CelShadingMeshOptions>): void {}
	public clearMeshOptions(mesh: BABYLON.Mesh): void {}
	public excludeMesh(mesh: BABYLON.Mesh): void {}
	public includeMesh(mesh: BABYLON.Mesh): void {}
	public register(): void {}
	public rebuild(): void {}
	public dispose(): void {}
}
```

- [ ] Register an `_afterRenderingMeshStage` collection step and rendering-group observers. On group start, install a chained `RenderingGroup.onBeforeTransparentRendering` fallback. Flush first from `onBeforeParticlesRenderingObservable`, otherwise from the fallback. Clear the queue at group completion.

- [ ] Filter collection to the active camera's output-target or camera render pass, the current group, non-blended materials, and one entry per `SubMesh`. Babylon 9.19 gives the main camera its own render pass ID, so comparing with `Constants.RENDERPASS_MAIN` would reject the actual screen pass. Deduplication prevents `needDepthPrePass` from producing two outline draws.

- [ ] Replace the dynamic import with a normal static import after the first passing implementation exists.

- [ ] Run the targeted test and confirm GREEN.

- [ ] Commit:

```powershell
git add packages/frontend-misskey-world-engine/package.json packages/frontend-misskey-world-engine/vitest.config.ts packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts pnpm-lock.yaml
git commit -m "feat(world): add scene-wide outline pass"
```

### Task 2: Add per-mesh policy, eligibility, and draw deduplication

**Files:**

- Modify: `packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts`
- Modify: `packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts`

- [ ] Add RED tests using real boxes for these externally visible behaviors:

```ts
renderer.excludeMesh(excluded);
renderer.setMeshOptions(styled, {
	color: new BABYLON.Color3(0.25, 0.5, 0.75),
	width: 10,
});
```

Assert that excluded meshes emit no outline draw, included meshes do, and the delegate observes the configured color/width on the rendering mesh.

- [ ] Extend the policy test so `includeMesh` re-enables an excluded mesh and `clearMeshOptions` restores constructor defaults. This protects every public policy mutation rather than only the first setter call.

- [ ] Add a RED test in which `material.needDepthPrePass = true`; assert the `SubMesh` is replayed exactly once even though Babylon renders its depth prepass and color pass.

- [ ] Add RED cases showing that an alpha-test mesh does enter the pass, while an alpha-blended mesh, disabled mesh, mesh without normals, and line/point fill mode do not.

- [ ] Confirm RED for the missing policies with the same targeted test command.

- [ ] Implement a `WeakMap<BABYLON.Mesh, Partial<CelShadingMeshOptions>>`. Resolve stored overrides over immutable constructor defaults at collection time. `setMeshOptions` merges existing partial overrides, `clearMeshOptions` deletes them, and include/exclude modify only `enabled`.

- [ ] Implement `isEligibleSubMesh` around observable behavior:

```ts
return options.enabled
	&& options.width > 0
	&& Number.isFinite(options.width)
	&& !mesh.isDisposed()
	&& mesh.isEnabled()
	&& mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)
	&& material != null
	&& !material.needAlphaBlendingForMesh(mesh)
	&& TRIANGLE_FILL_MODES.has(material.fillMode);
```

- [ ] Keep a `Set<BABYLON.SubMesh>` for the active group and enqueue only on the first occurrence.

- [ ] Run the targeted test and confirm GREEN.

- [ ] Commit:

```powershell
git add packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts
git commit -m "feat(world): configure outlines per mesh"
```

### Task 3: Implement the inverted-hull draw and complete state restoration

**Files:**

- Modify: `packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts`
- Modify: `packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts`

- [ ] Add a RED test with a non-uniformly scaled box. For requested world width `10` and absolute world scale `(2, 4, 5)`, assert that the delegate sees local `mesh.outlineWidth === 2`.

- [ ] Add a RED test for negative world determinant and material side orientation. The delegate must observe front-face culling with winding reversed exactly when Babylon's effective orientation requires it.

- [ ] Add a RED failure-path test. Make the delegate throw after reading temporary outline values, then assert that the mesh's prior `outlineWidth`/`outlineColor` and every captured engine state are restored.

- [ ] Confirm RED for width conversion, front-face culling, or restoration.

- [ ] Resolve world width conservatively:

```ts
const maxWorldScale = Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
const localWidth = maxWorldScale > BABYLON.Epsilon ? options.width / maxWorldScale : 0;
```

- [ ] Compute effective winding with the same material orientation and negative-determinant correction Babylon applies in `Mesh.render`:

```ts
let orientation = material._getEffectiveOrientation(mesh);
if (mesh._getWorldMatrixDeterminant() < 0) {
	orientation = orientation === BABYLON.Material.ClockWiseSideOrientation
		? BABYLON.Material.CounterClockWiseSideOrientation
		: BABYLON.Material.ClockWiseSideOrientation;
}
const reverseSide = orientation === BABYLON.Material.ClockWiseSideOrientation;
```

- [ ] Before every replay, enforce depth test on, depth writes off, alpha disabled, color writes on, zero z-offset, and front-face culling. Use the scene's normal or reverse-depth comparison as appropriate.

- [ ] Temporarily apply the resolved `outlineWidth` and `outlineColor`, then call the injected/default outline delegate:

```ts
this.outlineRenderer.render(entry.subMesh, entry.batch, false);
```

- [ ] Wrap both engine state and temporary mesh fields in `try/finally`, restoring exact prior depth/cull/front-face/z-offset, alpha, color-write, stencil-buffer, and global cull override values even when drawing throws.

- [ ] Set the Babylon outline delegate `enabled = false`, `zOffset = 0`, and `zOffsetUnits = 0` so its built-in before-mesh pass stays inactive and the new scheduler is the only owner of ordering.

- [ ] Run the targeted test and confirm GREEN.

- [ ] Commit:

```powershell
git add packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts
git commit -m "feat(world): render configurable inverted hulls"
```

### Task 4: Wire the reusable renderer into the lobby and exclude the skybox

**Files:**

- Modify: `packages/frontend-misskey-world-engine/src/babylonRuntime.ts`
- Modify: `packages/frontend-misskey-world-engine/src/engine.ts`
- Modify: `packages/frontend-misskey-world-engine/src/envs/lobby.ts`
- Modify: `packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts`
- Modify: `CHANGELOG.md`

- [ ] Add a RED constructor test using a real `Scene` and the default delegate factory; assert the registered Babylon renderer is disabled as an automatic mesh hook and configured with zero z-offsets. Register the Babylon runtime before creating the scene.

- [ ] Confirm RED because `RegisterOutlineRenderer` is not yet part of the package runtime setup.

- [ ] Add `BABYLON.RegisterOutlineRenderer()` to `registerBabylonRuntime()`.

- [ ] Give `WorldEngine` a public owned renderer so environment managers and future lobby systems can configure meshes without knowing its scheduling internals:

```ts
public readonly celShadingRenderer: CelShadingRenderer;
```

Instantiate it immediately after the scene is configured, with black and `cm(1)` defaults. Dispose it before `super.destroy()` tears down the Babylon engine and scene.

- [ ] In `LobbyEnvManager.load()`, exclude the skybox immediately after creation:

```ts
this.engine.celShadingRenderer.excludeMesh(this.skybox);
```

- [ ] Do not add avatar-specific registration. Avatar meshes use the scene defaults and therefore participate automatically when loaded.

- [ ] Add the user-visible Client changelog entry under `## Unreleased`:

```md
- Enhance: Worldのロビーでメッシュの輪郭線を表示するように
```

- [ ] Run the complete targeted renderer suite and confirm all tests pass:

```powershell
pnpm --filter frontend-misskey-world-engine test
```

Expected: all `CelShadingRenderer` tests pass with zero warnings/errors. Do not run typecheck, lint, build, or visual validation.

- [ ] Review the final diff for accidental locale/backend/Room changes and SPDX coverage:

```powershell
git diff --check
git status --short
git diff -- packages/frontend-misskey-world-engine CHANGELOG.md
```

- [ ] Commit:

```powershell
git add packages/frontend-misskey-world-engine/src/babylonRuntime.ts packages/frontend-misskey-world-engine/src/engine.ts packages/frontend-misskey-world-engine/src/envs/lobby.ts packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts CHANGELOG.md
git commit -m "feat(world): enable cel outlines in lobby"
```
