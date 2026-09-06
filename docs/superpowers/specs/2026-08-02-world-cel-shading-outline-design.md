# World Cel-Shading Outline Design

## Summary

Add black mesh borders to the Misskey World lobby by rendering an inverted hull after the lobby's opaque and alpha-tested geometry has populated the depth buffer. The renderer reuses each original Babylon.js `SubMesh`; it does not create or retain duplicate outline meshes, and it does not change the original material, lighting, color, or shadow behavior.

The first integration is limited to `WorldEngine`, which currently hosts the lobby. `RoomEngine` and the avatar preview engines do not create the renderer. The renderer itself remains scene-agnostic so another engine can opt in later by constructing it for that engine's `Scene`.

## Goals

- Draw an outline around exterior silhouettes.
- Draw an outline at occlusion contours inside an object, such as a cat ear obscuring the cat's head.
- Draw the same kind of contour when the foreground and background geometry belong to different Babylon.js meshes.
- Use an inverted-hull technique: expand vertices along their normals, cull front faces, and render the remaining back faces in black.
- Re-render the original `SubMesh` data instead of creating outline meshes.
- Allow scene defaults and per-mesh overrides for enabled state, color, and width.
- Automatically include meshes added to the lobby after initialization, including player avatars.
- Keep the implementation reusable by other World scenes.
- Preserve Babylon.js WebGPU snapshot rendering and avoid adding outlines to shadow, glow, reflection, or other auxiliary render passes.

## Non-goals

- Quantizing lighting, changing shadows, or changing surface colors.
- Detecting a visible crease solely because adjacent surface normals differ. A cube edge with no foreground/background depth relationship is not guaranteed to receive a line.
- Supporting alpha-blended transparent geometry in the initial implementation.
- Supporting lines, points, sprites, Gaussian splats, or other non-triangle primitives.
- Supporting arbitrary custom vertex displacement performed by `ShaderMaterial`, `NodeMaterial`, or another custom shader without an explicit future adapter.
- Giving different outline settings to individual instances within one hardware-instanced draw.
- Keeping outline width constant in screen pixels.

## Terminology

A Babylon.js `Mesh` owns geometry, transforms, skeleton and morph state, and a material or `MultiMaterial`. A `SubMesh` is an index range within a mesh and is the unit Babylon.js submits as a draw call. A mesh commonly has one submesh; a mesh using multiple material slots commonly has several. The outline renderer schedules and replays submeshes because that preserves their exact index ranges and material-specific alpha-test behavior. User-facing outline configuration remains mesh-scoped and applies to all submeshes rendered by that mesh.

## Why Babylon.js `renderOutline` Is Not Used

Babylon.js's built-in outline scheduling draws its colored expanded pass before the original mesh. The original mesh then overwrites contours that fall over deeper parts of that same mesh, leaving primarily the exterior silhouette. The requested cat-ear-over-head contour needs the complete opaque depth buffer to exist before the expanded hull is colored.

The new component reuses a disabled Babylon.js `OutlineRenderer` as a low-level submesh draw delegate, including its support for bones, morph targets, baked vertex animation, alpha testing, and instances. It calls the delegate's public `render()` method itself and must not use the built-in `mesh.renderOutline = true` scheduling path. The World component owns collection, ordering, culling, state restoration, and eligibility. `registerBabylonRuntime()` registers `OutlineRenderer`, and the World component sets the delegate's `enabled` flag to `false` so only the new scheduler can invoke it.

## Architecture

### `CelShadingRenderer`

Create a reusable `CelShadingRenderer` owned by one Babylon.js `Scene`. Its constructor accepts scene defaults:

```ts
export type CelShadingOptions = {
	enabled: boolean;
	color: BABYLON.Color3;
	width: number;
};

new CelShadingRenderer(scene, {
	enabled: true,
	color: BABYLON.Color3.Black(),
	width: cm(1),
});
```

`width` is expressed in Misskey World units, where `cm(1)` represents one centimetre. Before drawing, the renderer converts this value into the rendering mesh's local scale so lobby geometry baked into centimetres and avatar geometry beneath a `WORLD_SCALE` transform receive approximately the same world-space thickness. It decomposes the rendering mesh's world matrix, takes the largest absolute scale component, and passes `width / maxScale` to the low-level outline effect. Uniform scaling is handled exactly. With non-uniform scaling, choosing the largest component prevents the outline from becoming thicker than requested but allows it to be thinner along the other axes.

The renderer exposes mesh-level configuration without using `metadata`:

```ts
renderer.setMeshOptions(mesh, {
	enabled: true,
	color: new BABYLON.Color3(0.1, 0.1, 0.1),
	width: cm(0.6),
});
renderer.clearMeshOptions(mesh);
renderer.excludeMesh(mesh);
renderer.includeMesh(mesh);
```

Overrides are held in a `WeakMap<BABYLON.Mesh, Partial<CelShadingOptions>>`. Exclusion is represented by an `enabled: false` override. All submeshes and hardware instances in the rendering mesh's batch share the resolved mesh settings.

### Collection and replay

For the main render pass only, the component observes the per-submesh render stage and records each eligible opaque or alpha-tested draw. Entries are deduplicated so a depth prepass and the normal opaque pass do not cause two outline draws.

For each Babylon.js rendering group, the component replays the collected entries after that group's opaque and alpha-test queues have rendered and before its particle and transparent queues. It flushes from `Scene.onBeforeParticlesRenderingObservable` when the group has particles and uses a chained `RenderingGroup.onBeforeTransparentRendering` callback as the fallback when it does not. The existing rendering-group callback is always preserved. At this point the depth buffer contains both sides of a self-occlusion relationship. The ear's expanded back faces can therefore pass the depth test over the deeper head while remaining hidden over the nearer ear surface.

The replay uses these states:

- color write: enabled;
- depth test: enabled using the scene's compatible comparison;
- depth write: disabled;
- alpha blending: disabled;
- face culling: enabled, with front faces culled;
- winding: adjusted for the effective material orientation and negative world transforms;
- polygon depth offset: zero; hull expansion and the completed depth buffer determine visibility;
- outline color: resolved mesh color, black by default;
- vertex offset: resolved mesh width converted to local scale.

Before calling the low-level delegate, the scheduler temporarily sets the rendering mesh's Babylon.js `outlineColor` and `outlineWidth` fields to the resolved values and restores them afterward. The delegate's `zOffset` and `zOffsetUnits` are both configured as zero. Every modified mesh and engine state is saved and restored in a `try`/`finally` boundary. A submesh whose effect is not ready is skipped for that frame without preventing later entries or normal scene rendering. Queues are cleared at rendering-group boundaries and on errors.

### Main-pass isolation

Collection and replay occur only when `engine.currentRenderPassId` matches the active camera's output-target render pass or camera render pass. Babylon 9.19 assigns a dedicated render pass ID to the main camera instead of leaving the main scene on `Constants.RENDERPASS_MAIN`. Comparing against the active camera prevents outlines from leaking into `GlowLayer`, shadow maps, reflection probes, screenshots' auxiliary targets, or other object renderers. The renderer is installed before `SnapshotRenderingHelper.enableSnapshotRendering()` so its stable draw sequence can participate in the WebGPU snapshot capture. Existing World flows that disable snapshot rendering while adding or removing avatars continue to bracket those changes.

### FAST Snapshot replay synchronization

The renderer allocates one stable render-pass ID for the outline delegate's `SubMesh` draw wrappers and supplies it explicitly to every outline draw. FAST Snapshot Rendering records those draws once and later skips the normal mesh stages, so the renderer observes the main before-draw phase and updates existing outline wrappers without issuing additional draws. For every recorded wrapper it binds that wrapper's WebGPU `LeftOver` data buffer and writes the current `viewProjection`, effective `world`, local outline width, and resolved color before Babylon replays the GPU bundle. This mirrors Babylon's snapshot handling for effect-layer draw wrappers while keeping the cel-shading pass independent from `SnapshotRenderingHelper` internals.

### Rendering-group hook ownership

The transparent fallback is owned per `RenderingGroup` object, not per numeric rendering-group ID. A scene, GlowLayer, shadow/render target, or other `RenderingManager` can each own a different group object with the same ID. Keying only by ID would repeatedly wrap the callback when managers alternate and eventually create an unbounded callback chain. Object-identity ownership installs one wrapper per actual group, preserves that group's prior callback, and restores every still-owned callback during disposal.

### Lobby integration and lifecycle

`WorldEngine` constructs and owns the renderer before loading `LobbyEnvManager`. This makes imported lobby meshes and player avatars eligible without per-loader registration. `WorldEngine.destroy()` disposes the renderer before the scene is disposed.

`LobbyEnvManager` explicitly excludes its skybox. Invisible collision meshes are never submitted to the main color pass and therefore are not collected. Additional presentation-only meshes can call `excludeMesh()` when their visual result is unsuitable.

Neither `RoomEngine` nor avatar preview engines construct `CelShadingRenderer`. Future scene support consists of creating the same component for that scene and applying scene-specific exclusions.

## Eligibility and Compatibility

An entry is eligible only when all of the following are true:

- the current render pass matches the active camera's output-target or camera render pass;
- the rendering object is a triangle `BABYLON.Mesh` with a material;
- position and normal vertex buffers are present;
- the material does not require alpha blending for the effective mesh;
- resolved mesh options have `enabled: true` and `width > 0`;
- the mesh has not been disposed;
- the submesh belongs to the rendering group currently being collected.

Opaque `PBRMaterial`, `StandardMaterial`, and `MultiMaterial` submeshes are supported. Alpha-tested materials are supported by binding their alpha-test texture, UV selection, texture matrix, and cutoff behavior in the outline effect. Standard Babylon.js bones, morph targets, baked vertex animation, regular instances, and thin instances follow the same feature defines and bindings as the built-in outline effect.

The initial implementation automatically skips alpha-blended materials because their normal pass does not provide a reliable nearest-surface depth buffer. It also skips meshes without normals. Open or two-sided meshes may produce missing contours because an inverted hull relies on back-facing triangles. Hard-normal seams can produce gaps or spikes when displaced, and extreme widths can expose concave portions of the hull. Custom vertex shaders that move vertices will not match unless their deformation is added to the outline effect in a future adapter.

## Performance

Each eligible visible submesh adds one extra draw call and repeats its vertex deformation work. The fragment shader is a constant color and most interior fragments fail the depth test, but skinned and morphing avatars still pay an additional vertex cost. No duplicate vertex or index buffers are retained.

Per-mesh options do not create shader variants for color or width; both are uniforms. Feature variants are limited to geometry requirements already needed by the original submesh, such as bones, morph targets, instances, and alpha testing. Small or visually noisy meshes can be excluded, following the reference artwork's practice of omitting outlines from small details.

## Failure Handling and State Safety

- Unsupported meshes are skipped rather than partially rendered.
- A shader compilation or readiness delay skips only that submesh for the frame.
- Render queues are cleared even when a replay throws.
- Engine depth, culling, color-write, alpha, stencil, z-offset, and render-pass state are restored before control returns to Babylon.js.
- Disposal removes observers and rendering-group hooks where the installed callback is still owned by this component, releases render-pass identifiers, and clears strong references to queued submeshes.

## Testing

Add focused tests for the renderer's policy and orchestration using a fake outline draw delegate so tests do not require a browser WebGPU adapter:

1. defaults are resolved and mesh overrides win;
2. exclusion and re-inclusion work;
3. opaque and alpha-tested submeshes are collected;
4. alpha-blended, missing-normal, disposed, non-main-pass, and zero-width entries are skipped;
5. repeated collection of the same draw is deduplicated;
6. replay happens only after collection and is separated by rendering group;
7. all collected eligible entries are attempted even if one is not ready;
8. engine state and queues are restored when a draw throws;
9. negative transforms select the correct front-face winding;
10. width conversion gives matching world-space thickness for lobby-scale and `WORLD_SCALE` avatar transforms.

Run only the targeted automated tests for this renderer. Full-repository or full-package type checks, lint, and visual validation are intentionally excluded from this change's verification because the surrounding World implementation is under active development and already contains unrelated errors.

## Acceptance Criteria

- The World lobby displays black inverted-hull borders without changing surface lighting, shadows, or colors.
- An occluding foreground feature such as an avatar ear draws a line where it overlaps a deeper part such as the head.
- The result works whether the foreground and background are in one mesh, separate submeshes, or separate meshes in the same completed depth buffer.
- No outline mesh is created or retained.
- Meshes added after initialization, including lobby avatars, receive default outlines automatically.
- A caller can disable outlining and override color or width per mesh.
- The lobby skybox and unsupported alpha-blended or non-triangle content are not outlined.
- Room and avatar preview scenes remain unchanged.
- Auxiliary render passes remain unchanged.
- Targeted renderer tests pass.
