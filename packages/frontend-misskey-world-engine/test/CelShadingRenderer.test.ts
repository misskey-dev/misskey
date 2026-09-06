/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { CelShadingRenderer } from '../src/CelShadingRenderer.js';

class StateTrackingNullEngine extends BABYLON.NullEngine {
	public lastRenderState: {
		culling: boolean;
		zOffset: number;
		reverseSide: boolean;
		cullBackFaces: boolean | undefined;
		zOffsetUnits: number;
	} | null = null;

	public override setState(...args: Parameters<BABYLON.NullEngine['setState']>): void {
		const [culling, zOffset = 0, , reverseSide = false, cullBackFaces, , zOffsetUnits = 0] = args;
		this.lastRenderState = { culling, zOffset, reverseSide, cullBackFaces, zOffsetUnits };
		this.depthCullingState.cull = culling;
		this.depthCullingState.cullFace = (this.cullBackFaces ?? cullBackFaces ?? true) ? 1 : 2;
		this.depthCullingState.frontFace = reverseSide ? 2 : 1;
		this.depthCullingState.zOffset = zOffset;
		this.depthCullingState.zOffsetUnits = zOffsetUnits;
		super.setState(...args);
	}
}

class FastSnapshotNullEngine extends StateTrackingNullEngine {
	public fastSnapshotRendering = false;

	public override get snapshotRendering(): boolean {
		return this.fastSnapshotRendering;
	}

	public override set snapshotRendering(value: boolean) {
		this.fastSnapshotRendering = value;
	}

	public override get snapshotRenderingMode(): number {
		return BABYLON.Constants.SNAPSHOTRENDERING_FAST;
	}

	public override set snapshotRenderingMode(_value: number) {
	}
}

function createScene(engine: BABYLON.NullEngine = new BABYLON.NullEngine()) {
	const scene = new BABYLON.Scene(engine);
	const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -10), scene);
	camera.setTarget(BABYLON.Vector3.Zero());
	scene.activeCamera = camera;
	return { engine, scene };
}

async function renderScene(scene: BABYLON.Scene): Promise<void> {
	await scene.whenReadyAsync();
	scene.render();
}

function createOpaqueBox(name: string, scene: BABYLON.Scene): BABYLON.Mesh {
	const mesh = BABYLON.MeshBuilder.CreateBox(name, {}, scene);
	mesh.material = new BABYLON.StandardMaterial(`${name}Material`, scene);
	return mesh;
}

function readEngineState(engine: BABYLON.NullEngine) {
	const depth = engine.depthCullingState;
	return {
		depthTest: depth.depthTest,
		depthMask: depth.depthMask,
		depthFunc: depth.depthFunc,
		cull: depth.cull,
		cullFace: depth.cullFace,
		frontFace: depth.frontFace,
		zOffset: depth.zOffset,
		zOffsetUnits: depth.zOffsetUnits,
		alphaMode: engine.getAlphaMode(),
		colorWrite: engine.getColorWrite(),
		stencilBuffer: engine.getStencilBuffer(),
		cullBackFaces: engine.cullBackFaces,
	};
}

function notifyBeforeRenderingGroup(scene: BABYLON.Scene, renderingManager: BABYLON.RenderingManager, renderingGroupId = 0): void {
	scene.onBeforeRenderingGroupObservable.notifyObservers({
		scene,
		camera: scene.activeCamera,
		renderingGroupId,
		renderingManager,
	});
}

test('does not rewrap rendering groups when different managers share the same group id', () => {
	const { engine, scene } = createScene();
	const mainRenderingManager = scene.renderingManager;
	const auxiliaryRenderingManager = new BABYLON.RenderingManager(scene);
	const mainGroup = mainRenderingManager.getRenderingGroup(0);
	const auxiliaryGroup = auxiliaryRenderingManager.getRenderingGroup(0);
	let mainCallbackCalls = 0;
	let auxiliaryCallbackCalls = 0;
	const mainCallback = () => mainCallbackCalls++;
	const auxiliaryCallback = () => auxiliaryCallbackCalls++;
	mainGroup.onBeforeTransparentRendering = mainCallback;
	auxiliaryGroup.onBeforeTransparentRendering = auxiliaryCallback;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {},
		},
	});

	try {
		notifyBeforeRenderingGroup(scene, mainRenderingManager);
		const installedMainCallback = mainGroup.onBeforeTransparentRendering;
		notifyBeforeRenderingGroup(scene, auxiliaryRenderingManager);
		const installedAuxiliaryCallback = auxiliaryGroup.onBeforeTransparentRendering;

		notifyBeforeRenderingGroup(scene, mainRenderingManager);
		notifyBeforeRenderingGroup(scene, auxiliaryRenderingManager);

		expect(mainGroup.onBeforeTransparentRendering).toBe(installedMainCallback);
		expect(auxiliaryGroup.onBeforeTransparentRendering).toBe(installedAuxiliaryCallback);
		mainGroup.onBeforeTransparentRendering?.();
		auxiliaryGroup.onBeforeTransparentRendering?.();
		expect(mainCallbackCalls).toBe(1);
		expect(auxiliaryCallbackCalls).toBe(1);
	} finally {
		renderer.dispose();
		auxiliaryRenderingManager.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('owns a stable draw-wrapper render pass for outline draws', async () => {
	const { engine, scene } = createScene();
	createOpaqueBox('renderPassOwner', scene);
	const observedRenderPassIds: Array<number | undefined> = [];
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(subMesh, _batch, _useOverlay, renderPassId) {
				observedRenderPassIds.push(renderPassId);
				if (renderPassId !== undefined) subMesh._getDrawWrapper(renderPassId, true);
			},
		},
	});

	try {
		await renderScene(scene);

		expect(observedRenderPassIds).toHaveLength(1);
		const renderPassId = observedRenderPassIds[0];
		expect(renderPassId).toEqual(expect.any(Number));
		expect(renderPassId).not.toBe(scene.activeCamera!.renderPassId);
		renderer.dispose();
		expect(scene.meshes[0].subMeshes?.[0]._getDrawWrapper(renderPassId)).toBeUndefined();
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('updates recorded outline uniforms before fast snapshot bundle replay', async () => {
	const engine = new FastSnapshotNullEngine();
	const { scene } = createScene(engine);
	const mesh = createOpaqueBox('snapshotOutline', scene);
	let outlineRenderPassId: number | undefined;
	let snapshotSubMesh: BABYLON.SubMesh | undefined;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: new BABYLON.Color3(0.2, 0.3, 0.4),
		width: 6,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(_subMesh, _batch, _useOverlay, renderPassId) {
				outlineRenderPassId = renderPassId;
			},
		},
	});

	try {
		await renderScene(scene);
		if (outlineRenderPassId === undefined) throw new Error('outline render pass was not created');
		const subMesh = mesh.subMeshes![0];
		snapshotSubMesh = subMesh;
		const drawWrapper = subMesh._getDrawWrapper(outlineRenderPassId, true)!;
		const dataBuffer = { name: 'outlineLeftOver' };
		let boundDataBuffer: unknown;
		let uniformBufferUpdates = 0;
		const matrices = new Map<string, number[]>();
		const floats = new Map<string, number>();
		const colors = new Map<string, number[]>();
		const effect = {
			_pipelineContext: {
				uniformBuffer: {
					setDataBuffer(buffer: unknown) {
						boundDataBuffer = buffer;
						return true;
					},
					update() {
						uniformBufferUpdates++;
					},
				},
			},
			setMatrix(name: string, matrix: BABYLON.Matrix) {
				matrices.set(name, [...matrix.asArray()]);
			},
			setFloat(name: string, value: number) {
				floats.set(name, value);
			},
			setColor4(name: string, color: BABYLON.Color3, alpha: number) {
				colors.set(name, [...color.asArray(), alpha]);
			},
		};
		(drawWrapper as unknown as { effect: typeof effect }).effect = effect;
		(drawWrapper as unknown as { drawContext: { buffers: Record<string, unknown> } }).drawContext = {
			buffers: { LeftOver: dataBuffer },
		};

		mesh.position.copyFromFloats(4, 2, 1);
		mesh.scaling.copyFromFloats(2, 2, 2);
		mesh.computeWorldMatrix(true);
		scene.activeCamera!.position.copyFromFloats(3, 1, -12);
		(scene.activeCamera as BABYLON.FreeCamera).setTarget(BABYLON.Vector3.Zero());
		scene.updateTransformMatrix(true);
		const expectedWorld = [...mesh.getWorldMatrix().asArray()];
		const expectedViewProjection = [...scene.getTransformMatrix().asArray()];

		engine.fastSnapshotRendering = true;
		scene.onBeforeDrawPhaseObservable.notifyObservers(scene);

		expect(boundDataBuffer).toBe(dataBuffer);
		expect(uniformBufferUpdates).toBe(1);
		expect(matrices.get('world')).toEqual(expectedWorld);
		expect(matrices.get('viewProjection')).toEqual(expectedViewProjection);
		expect(floats.get('offset')).toBe(3);
		expect(colors.get('color')).toEqual([0.2, 0.3, 0.4, 1]);
	} finally {
		if (outlineRenderPassId !== undefined && snapshotSubMesh !== undefined) {
			snapshotSubMesh._removeDrawWrapper(outlineRenderPassId, false);
		}
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('replays opaque meshes after their color pass and before transparent meshes', async () => {
	const { engine, scene } = createScene();

	const opaque = BABYLON.MeshBuilder.CreateBox('opaque', {}, scene);
	opaque.material = new BABYLON.StandardMaterial('opaqueMaterial', scene);
	const transparent = BABYLON.MeshBuilder.CreateBox('transparent', {}, scene);
	const transparentMaterial = new BABYLON.StandardMaterial('transparentMaterial', scene);
	transparentMaterial.alpha = 0.5;
	transparent.material = transparentMaterial;

	const events: string[] = [];
	opaque.onAfterRenderObservable.add(() => events.push('opaque'));
	transparent.onAfterRenderObservable.add(() => events.push('transparent'));

	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(subMesh: BABYLON.SubMesh) {
				events.push(`outline:${subMesh.getRenderingMesh().name}`);
			},
		},
	});

	try {
		await renderScene(scene);

		expect(events).toEqual(['opaque', 'outline:opaque', 'transparent']);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('applies per-mesh outline overrides and exclusions', async () => {
	const { engine, scene } = createScene();
	const defaultMesh = createOpaqueBox('default', scene);
	const styledMesh = createOpaqueBox('styled', scene);
	const excludedMesh = createOpaqueBox('excluded', scene);
	const draws: Array<{ name: string; width: number; color: number[] }> = [];
	const outlineRenderer = {
		enabled: true,
		zOffset: 1,
		zOffsetUnits: 4,
		render(subMesh: BABYLON.SubMesh) {
			const mesh = subMesh.getRenderingMesh();
			draws.push({
				name: mesh.name,
				width: mesh.outlineWidth,
				color: mesh.outlineColor.asArray(),
			});
		},
	};
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: new BABYLON.Color3(0.1, 0.2, 0.3),
		width: 3,
	}, { outlineRenderer });

	try {
		renderer.setMeshOptions(styledMesh, {
			color: new BABYLON.Color3(0.25, 0.5, 0.75),
			width: 10,
		});
		renderer.excludeMesh(excludedMesh);
		await renderScene(scene);

		expect(draws).toEqual([
			{ name: defaultMesh.name, width: 3, color: [0.1, 0.2, 0.3] },
			{ name: styledMesh.name, width: 10, color: [0.25, 0.5, 0.75] },
		]);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('can include a previously excluded mesh again', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('includedAgain', scene);
	const draws: string[] = [];
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(subMesh: BABYLON.SubMesh) {
				draws.push(subMesh.getRenderingMesh().name);
			},
		},
	});

	try {
		renderer.excludeMesh(mesh);
		renderer.includeMesh(mesh);
		await renderScene(scene);

		expect(draws).toEqual(['includedAgain']);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('can clear mesh overrides back to the scene defaults', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('cleared', scene);
	const draws: Array<{ width: number; color: number[] }> = [];
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: new BABYLON.Color3(0.1, 0.2, 0.3),
		width: 2,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(subMesh: BABYLON.SubMesh) {
				const renderingMesh = subMesh.getRenderingMesh();
				draws.push({
					width: renderingMesh.outlineWidth,
					color: renderingMesh.outlineColor.asArray(),
				});
			},
		},
	});

	try {
		renderer.setMeshOptions(mesh, {
			color: BABYLON.Color3.White(),
			width: 9,
		});
		renderer.clearMeshOptions(mesh);
		await renderScene(scene);

		expect(draws).toEqual([{ width: 2, color: [0.1, 0.2, 0.3] }]);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('replays a submesh only once when its material uses a depth prepass', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('depthPrepass', scene);
	mesh.material!.needDepthPrePass = true;
	let outlineDraws = 0;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				outlineDraws++;
			},
		},
	});

	try {
		await renderScene(scene);

		expect(outlineDraws).toBe(1);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('does not replay wireframe geometry as an inverted hull', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('wireframe', scene);
	mesh.material!.wireframe = true;
	let outlineDraws = 0;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				outlineDraws++;
			},
		},
	});

	try {
		await renderScene(scene);

		expect(outlineDraws).toBe(0);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('does not replay a triangle mesh without vertex normals', async () => {
	const { engine, scene } = createScene();
	const mesh = new BABYLON.Mesh('normalLess', scene);
	mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, [
		-1, -1, 0,
		1, -1, 0,
		0, 1, 0,
	]);
	mesh.setIndices([0, 1, 2]);
	mesh.material = new BABYLON.ShaderMaterial('positionOnlyMaterial', scene, {
		vertexSource: `
			precision highp float;
			attribute vec3 position;
			uniform mat4 worldViewProjection;
			void main(void) {
				gl_Position = worldViewProjection * vec4(position, 1.0);
			}
		`,
		fragmentSource: `
			precision highp float;
			void main(void) {
				gl_FragColor = vec4(1.0);
			}
		`,
	}, {
		attributes: [BABYLON.VertexBuffer.PositionKind],
		uniforms: ['worldViewProjection'],
	});
	let outlineDraws = 0;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				outlineDraws++;
			},
		},
	});

	try {
		await renderScene(scene);

		expect(outlineDraws).toBe(0);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('replays alpha-test meshes in the outline pass', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('alphaTest', scene);
	mesh.material!.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
	let outlineDraws = 0;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				outlineDraws++;
			},
		},
	});

	try {
		await renderScene(scene);

		expect(outlineDraws).toBe(1);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('flushes the outline pass before particle rendering', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('withParticles', scene);
	const events: string[] = [];
	mesh.onAfterRenderObservable.add(() => events.push('opaque'));
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				events.push('outline');
			},
		},
	});

	try {
		await renderScene(scene);
		events.length = 0;
		const particleSystem = new BABYLON.ParticleSystem('particles', 1, scene);
		particleSystem.emitter = BABYLON.Vector3.Zero();
		particleSystem.start();
		const renderParticles = particleSystem.render.bind(particleSystem);
		particleSystem.render = () => {
			events.push('particles');
			return renderParticles();
		};
		events.length = 0;
		scene.render();
		const eventsAfterOpaque = events.slice(events.indexOf('opaque'));

		expect(eventsAfterOpaque).toEqual(['opaque', 'outline', 'particles']);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('converts world outline width to the mesh local scale', async () => {
	const { engine, scene } = createScene();
	const mesh = createOpaqueBox('scaled', scene);
	mesh.scaling.copyFromFloats(2, 4, 5);
	let renderedWidth: number | null = null;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 10,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render(subMesh: BABYLON.SubMesh) {
				renderedWidth = subMesh.getRenderingMesh().outlineWidth;
			},
		},
	});

	try {
		await renderScene(scene);

		expect(renderedWidth).toBe(2);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('front-culls the inverted hull using the effective winding of a negative-scale mesh', async () => {
	const engine = new StateTrackingNullEngine();
	const { scene } = createScene(engine);
	const mesh = createOpaqueBox('negativeScale', scene);
	mesh.scaling.x = -1;
	let outlineState: StateTrackingNullEngine['lastRenderState'] = null;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				outlineState = engine.lastRenderState == null ? null : { ...engine.lastRenderState };
			},
		},
	});

	try {
		await renderScene(scene);

		expect(outlineState).toEqual({
			culling: true,
			zOffset: 0,
			reverseSide: true,
			cullBackFaces: false,
			zOffsetUnits: 0,
		});
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('restores mesh and engine state when the outline draw throws', async () => {
	const engine = new StateTrackingNullEngine();
	const { scene } = createScene(engine);
	const mesh = createOpaqueBox('throwingOutline', scene);
	const previousColor = new BABYLON.Color3(0.8, 0.7, 0.6);
	mesh.outlineColor = previousColor;
	mesh.outlineWidth = 17;
	const sentinelState = {
		depthTest: false,
		depthMask: true,
		depthFunc: BABYLON.Constants.GREATER,
		cull: false,
		cullFace: 91,
		frontFace: 92,
		zOffset: 7,
		zOffsetUnits: 8,
		alphaMode: BABYLON.Constants.ALPHA_ADD,
		colorWrite: false,
		stencilBuffer: true,
		cullBackFaces: true,
	};
	const group = scene.renderingManager.getRenderingGroup(0);
	group.onBeforeTransparentRendering = () => {
		engine.setAlphaMode(sentinelState.alphaMode);
		engine.setColorWrite(sentinelState.colorWrite);
		engine.setStencilBuffer(sentinelState.stencilBuffer);
		engine.cullBackFaces = sentinelState.cullBackFaces;
		const depth = engine.depthCullingState;
		depth.depthTest = sentinelState.depthTest;
		depth.depthMask = sentinelState.depthMask;
		depth.depthFunc = sentinelState.depthFunc;
		depth.cull = sentinelState.cull;
		depth.cullFace = sentinelState.cullFace;
		depth.frontFace = sentinelState.frontFace;
		depth.zOffset = sentinelState.zOffset;
		depth.zOffsetUnits = sentinelState.zOffsetUnits;
	};
	const drawError = new Error('outline draw failed');
	let stateDuringOutline: ReturnType<typeof readEngineState> | null = null;
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	}, {
		outlineRenderer: {
			enabled: true,
			zOffset: 1,
			zOffsetUnits: 4,
			render() {
				stateDuringOutline = readEngineState(engine);
				throw drawError;
			},
		},
	});

	try {
		await scene.whenReadyAsync();
		let thrown: unknown = null;
		try {
			scene.render();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBe(drawError);
		expect(stateDuringOutline).toEqual({
			depthTest: true,
			depthMask: true,
			depthFunc: BABYLON.Constants.LEQUAL,
			cull: true,
			cullFace: 2,
			frontFace: 1,
			zOffset: 0,
			zOffsetUnits: 0,
			alphaMode: BABYLON.Constants.ALPHA_DISABLE,
			colorWrite: true,
			stencilBuffer: false,
			cullBackFaces: null,
		});
		expect(readEngineState(engine)).toEqual(sentinelState);
		expect(mesh.outlineWidth).toBe(17);
		expect(mesh.outlineColor).toBe(previousColor);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});

test('uses a disabled zero-offset Babylon outline delegate by default', () => {
	const { engine, scene } = createScene();
	const renderer = new CelShadingRenderer(scene, {
		enabled: true,
		color: BABYLON.Color3.Black(),
		width: 1,
	});

	try {
		const outlineRenderer = scene.getOutlineRenderer();
		expect(outlineRenderer.enabled).toBe(false);
		expect(outlineRenderer.zOffset).toBe(0);
		expect(outlineRenderer.zOffsetUnits).toBe(0);
	} finally {
		renderer.dispose();
		scene.dispose();
		engine.dispose();
	}
});
