# World Cel-Shading Outline Snapshot Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the scene-wide inverted-hull outline synchronized during WebGPU FAST Snapshot Rendering and prevent rendering-group fallback hooks from growing into a recursive callback chain.

**Architecture:** Give the cel-shading pass its own stable Babylon render-pass ID so its `SubMesh` draw wrappers can be found again during snapshot replay. Before the main draw phase, update each recorded outline wrapper's WebGPU `LeftOver` uniform buffer with current camera, mesh, width, and color values. Track transparent-fallback hooks by `RenderingGroup` object identity rather than numeric group ID, because separate rendering managers reuse the same IDs.

**Tech Stack:** TypeScript, Babylon.js 9.19, Vitest, Babylon `NullEngine` test scenes.

## Global Constraints

- Preserve the existing Scene-wide post-opaque inverted-hull architecture and per-mesh settings.
- Do not create duplicate outline meshes.
- Keep outlines limited to `WorldEngine`; do not enable them in Room or preview engines.
- Preserve callbacks that already occupy `RenderingGroup.onBeforeTransparentRendering`.
- Run only `frontend-misskey-world-engine` targeted tests and diff checks. Do not run visual validation, package/full type checks, or lint.

---

### Task 1: Reproduce both regressions

**Files:**

- Modify: `packages/frontend-misskey-world-engine/test/CelShadingRenderer.test.ts`

- [ ] Add a test that alternates two real `RenderingManager` instances using rendering group ID `0`, then verifies each `RenderingGroup` retains one stable cel-shading callback and its original callback is invoked once.
- [ ] Add a test that renders one outlined mesh, enables a FAST-snapshot test engine state, changes the camera/mesh transform, triggers the real before-draw observable, and verifies the outline draw wrapper receives current `viewProjection`, `world`, `offset`, and `color` values through its `LeftOver` buffer.
- [ ] Run `pnpm --filter frontend-misskey-world-engine test -- test/CelShadingRenderer.test.ts` and confirm both new tests fail for the intended missing behavior.

### Task 2: Fix hook ownership and snapshot uniform updates

**Files:**

- Modify: `packages/frontend-misskey-world-engine/src/CelShadingRenderer.ts`

- [ ] Key fallback-hook ownership by `BABYLON.RenderingGroup` object identity and restore every owned group callback on dispose.
- [ ] Allocate one cel-shading draw-wrapper render-pass ID, pass it to every `OutlineRenderer.render` call, and release it on dispose.
- [ ] Observe `Scene.onBeforeDrawPhaseObservable`. In FAST Snapshot Rendering, find existing outline draw wrappers for the dedicated ID, bind their WebGPU `LeftOver` data buffer, and update current `viewProjection`, effective `world`, local-width `offset`, and per-mesh `color` before bundle replay.
- [ ] Run the targeted renderer test file and confirm all tests pass.

### Task 3: Verify the scoped change

**Files:**

- Modify: `docs/superpowers/specs/2026-08-02-world-cel-shading-outline-design.md`

- [ ] Document the dedicated snapshot wrapper update and RenderingGroup object-identity ownership.
- [ ] Run `pnpm --filter frontend-misskey-world-engine test`.
- [ ] Run `git diff --check` and inspect `git status --short` plus the scoped diff.
- [ ] Do not run visual validation, type checks, lint, or unrelated package tests.
