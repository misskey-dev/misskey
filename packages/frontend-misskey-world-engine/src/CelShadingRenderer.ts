/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';

type InstancesBatch = Parameters<BABYLON.OutlineRenderer['render']>[1];

const TRIANGLE_FILL_MODES = new Set<number>([
	BABYLON.Material.TriangleFillMode,
	BABYLON.Material.TriangleStripDrawMode,
	BABYLON.Material.TriangleFanDrawMode,
]);

export type CelShadingOutlineRenderer = Pick<BABYLON.OutlineRenderer, 'enabled' | 'zOffset' | 'zOffsetUnits' | 'render'>;

export type CelShadingOptions = {
	enabled: boolean;
	color: BABYLON.Color3;
	width: number;
};

export type CelShadingRendererDependencies = {
	outlineRenderer: CelShadingOutlineRenderer;
};

type QueuedSubMesh = {
	mesh: BABYLON.Mesh;
	subMesh: BABYLON.SubMesh;
	batch: InstancesBatch;
	options: CelShadingOptions;
};

type RenderingGroupHook = {
	group: BABYLON.RenderingGroup;
	previous: (() => void) | undefined;
	callback: () => void;
};

type EngineState = {
	depthTest: boolean;
	depthMask: boolean;
	depthFunc: BABYLON.Nullable<number>;
	cull: BABYLON.Nullable<boolean>;
	cullFace: BABYLON.Nullable<number>;
	frontFace: BABYLON.Nullable<number>;
	zOffset: number;
	zOffsetUnits: number;
	alphaMode: number;
	colorWrite: boolean;
	stencilBuffer: boolean;
	stencilMaterial: BABYLON.IStencilState | undefined;
	cullBackFaces: BABYLON.Nullable<boolean>;
};

export class CelShadingRenderer implements BABYLON.ISceneComponent {
	public readonly name = 'CelShadingRenderer';
	public readonly scene: BABYLON.Scene;

	private readonly outlineRenderer: CelShadingOutlineRenderer;
	private readonly outlineRenderPassId: number;
	private readonly defaultOptions: CelShadingOptions;
	private readonly meshOptions = new WeakMap<BABYLON.Mesh, Partial<CelShadingOptions>>();
	private readonly renderingGroupHooks = new Map<BABYLON.RenderingGroup, RenderingGroupHook>();
	private readonly recordedOutlineSubMeshes = new Set<BABYLON.SubMesh>();
	private readonly queuedSubMeshes: QueuedSubMesh[] = [];
	private readonly queuedSubMeshSet = new Set<BABYLON.SubMesh>();
	private readonly worldScale = new BABYLON.Vector3();
	private currentRenderingGroupId: number | null = null;
	private disposed = false;

	private readonly beforeRenderingGroupObserver: BABYLON.Observer<BABYLON.RenderingGroupInfo>;
	private readonly afterRenderingGroupObserver: BABYLON.Observer<BABYLON.RenderingGroupInfo>;
	private readonly beforeParticlesRenderingObserver: BABYLON.Observer<BABYLON.Scene>;
	private readonly beforeDrawPhaseObserver: BABYLON.Observer<BABYLON.Scene>;

	public constructor(scene: BABYLON.Scene, options: CelShadingOptions, dependencies?: CelShadingRendererDependencies) {
		this.scene = scene;
		this.defaultOptions = {
			enabled: options.enabled,
			color: options.color.clone(),
			width: options.width,
		};
		this.outlineRenderer = dependencies?.outlineRenderer ?? this.scene.getOutlineRenderer();
		this.outlineRenderer.enabled = false;
		this.outlineRenderer.zOffset = 0;
		this.outlineRenderer.zOffsetUnits = 0;
		this.outlineRenderPassId = this.scene.getEngine().createRenderPassId('Cel Shading Outline');

		this.register();
		this.beforeRenderingGroupObserver = this.scene.onBeforeRenderingGroupObservable.add(this.onBeforeRenderingGroup);
		this.afterRenderingGroupObserver = this.scene.onAfterRenderingGroupObservable.add(this.onAfterRenderingGroup);
		this.beforeParticlesRenderingObserver = this.scene.onBeforeParticlesRenderingObservable.add(this.onBeforeParticlesRendering);
		this.beforeDrawPhaseObserver = this.scene.onBeforeDrawPhaseObservable.add(this.updateSnapshotOutlineUniforms);
	}

	public setMeshOptions(mesh: BABYLON.Mesh, options: Partial<CelShadingOptions>): void {
		this.meshOptions.set(mesh, {
			...this.meshOptions.get(mesh),
			...options,
		});
	}

	public clearMeshOptions(mesh: BABYLON.Mesh): void {
		this.meshOptions.delete(mesh);
	}

	public excludeMesh(mesh: BABYLON.Mesh): void {
		this.setMeshOptions(mesh, { enabled: false });
	}

	public includeMesh(mesh: BABYLON.Mesh): void {
		this.setMeshOptions(mesh, { enabled: true });
	}

	public register(): void {
		this.scene._afterRenderingMeshStage.registerStep(0, this, this.collectSubMesh);
	}

	public rebuild(): void {
	}

	public dispose(): void {
		if (this.disposed) return;
		this.disposed = true;

		this.scene.onBeforeRenderingGroupObservable.remove(this.beforeRenderingGroupObserver);
		this.scene.onAfterRenderingGroupObservable.remove(this.afterRenderingGroupObserver);
		this.scene.onBeforeParticlesRenderingObservable.remove(this.beforeParticlesRenderingObserver);
		this.scene.onBeforeDrawPhaseObservable.remove(this.beforeDrawPhaseObserver);
		this.removeStageSteps();

		for (const hook of this.renderingGroupHooks.values()) {
			if (hook.group.onBeforeTransparentRendering === hook.callback) {
				hook.group.onBeforeTransparentRendering = hook.previous!;
			}
		}
		this.renderingGroupHooks.clear();
		this.recordedOutlineSubMeshes.clear();
		this.clearQueue();
		this.scene.getEngine().releaseRenderPassId(this.outlineRenderPassId);
	}

	private readonly onBeforeRenderingGroup = (info: BABYLON.RenderingGroupInfo): void => {
		this.currentRenderingGroupId = info.renderingGroupId;
		this.clearQueue();
		this.installRenderingGroupHook(info.renderingGroupId, info.renderingManager.getRenderingGroup(info.renderingGroupId));
	};

	private readonly onAfterRenderingGroup = (): void => {
		this.clearQueue();
		this.currentRenderingGroupId = null;
	};

	private readonly onBeforeParticlesRendering = (): void => {
		if (this.currentRenderingGroupId !== null) this.flush(this.currentRenderingGroupId);
	};

	private readonly updateSnapshotOutlineUniforms = (): void => {
		const engine = this.scene.getEngine();
		if (!engine.snapshotRendering || engine.snapshotRenderingMode !== BABYLON.Constants.SNAPSHOTRENDERING_FAST) {
			this.recordedOutlineSubMeshes.clear();
			return;
		}

		// FAST snapshot replay skips OutlineRenderer.render(), so its standalone uniforms must be updated directly.
		const viewProjection = this.scene.getTransformMatrix();
		for (const subMesh of this.recordedOutlineSubMeshes) {
			const drawWrapper = subMesh._getDrawWrapper(this.outlineRenderPassId);
			const effect = drawWrapper?.effect;
			const dataBuffer = (drawWrapper?.drawContext as BABYLON.WebGPUDrawContext | undefined)?.buffers['LeftOver'];
			const uniformBuffer = (effect?._pipelineContext as BABYLON.WebGPUPipelineContext | undefined)?.uniformBuffer;
			if (effect == null || dataBuffer == null || uniformBuffer == null || !uniformBuffer.setDataBuffer(dataBuffer)) continue;

			const material = subMesh.getMaterial();
			if (material == null) continue;
			const renderingMesh = subMesh.getRenderingMesh();
			if (renderingMesh.isDisposed()) continue;
			const ownerMesh = subMesh.getMesh();
			const effectiveMesh = ownerMesh._internalAbstractMeshDataInfo._actAsRegularMesh ? ownerMesh : renderingMesh;
			const options = this.resolveMeshOptions(renderingMesh);
			const localWidth = options.enabled && Number.isFinite(options.width) && options.width > 0
				? this.getLocalWidth(renderingMesh, options.width)
				: 0;

			effect.setMatrix('viewProjection', viewProjection);
			effect.setMatrix('world', effectiveMesh.computeWorldMatrix());
			effect.setFloat('offset', localWidth);
			effect.setColor4('color', options.color, material.alpha);
			uniformBuffer.update();
		}
	};

	private collectSubMesh(mesh: BABYLON.Mesh, subMesh: BABYLON.SubMesh, batch: InstancesBatch): void {
		if (this.currentRenderingGroupId === null) return;
		if (!this.isMainRenderPass()) return;
		if (mesh.renderingGroupId !== this.currentRenderingGroupId) return;

		const material = subMesh.getMaterial();
		if (material == null || material.needAlphaBlendingForMesh(mesh)) return;
		if (!TRIANGLE_FILL_MODES.has(material.fillMode)) return;
		if (!mesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) return;
		const options = this.resolveMeshOptions(mesh);
		if (!options.enabled || !Number.isFinite(options.width) || options.width <= 0) return;
		if (this.queuedSubMeshSet.has(subMesh)) return;

		this.queuedSubMeshSet.add(subMesh);
		this.queuedSubMeshes.push({ mesh, subMesh, batch, options });
	}

	private resolveMeshOptions(mesh: BABYLON.Mesh): CelShadingOptions {
		return {
			...this.defaultOptions,
			...this.meshOptions.get(mesh),
		};
	}

	private isMainRenderPass(): boolean {
		const camera = this.scene.activeCamera;
		const mainRenderPassId = camera?.outputRenderTarget?.renderPassId ?? camera?.renderPassId ?? BABYLON.Constants.RENDERPASS_MAIN;
		return this.scene.getEngine().currentRenderPassId === mainRenderPassId;
	}

	private installRenderingGroupHook(renderingGroupId: number, group: BABYLON.RenderingGroup): void {
		if (this.renderingGroupHooks.has(group)) return;

		const previous = group.onBeforeTransparentRendering;
		const callback = (): void => {
			previous?.();
			this.flush(renderingGroupId);
		};
		group.onBeforeTransparentRendering = callback;
		this.renderingGroupHooks.set(group, { group, previous, callback });
	}

	private flush(renderingGroupId: number): void {
		if (this.currentRenderingGroupId !== renderingGroupId || this.queuedSubMeshes.length === 0) return;

		const engine = this.scene.getEngine();
		const previousEngineState = this.captureEngineState(engine);
		try {
			this.prepareEngineForOutline(engine);
			for (const entry of this.queuedSubMeshes) {
				const localWidth = this.getLocalWidth(entry.mesh, entry.options.width);
				if (localWidth <= 0) continue;
				this.setInvertedHullCulling(entry);
				const previousWidth = entry.mesh.outlineWidth;
				const previousColor = entry.mesh.outlineColor;
				try {
					entry.mesh.outlineWidth = localWidth;
					entry.mesh.outlineColor = entry.options.color;
					this.outlineRenderer.render(entry.subMesh, entry.batch, false, this.outlineRenderPassId);
					this.recordedOutlineSubMeshes.add(entry.subMesh);
				} finally {
					entry.mesh.outlineWidth = previousWidth;
					entry.mesh.outlineColor = previousColor;
				}
			}
		} finally {
			this.restoreEngineState(engine, previousEngineState);
			this.clearQueue();
		}
	}

	private captureEngineState(engine: BABYLON.AbstractEngine): EngineState {
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
			stencilMaterial: engine.stencilStateComposer.stencilMaterial,
			cullBackFaces: engine.cullBackFaces,
		};
	}

	private prepareEngineForOutline(engine: BABYLON.AbstractEngine): void {
		engine.cullBackFaces = null;
		engine.setAlphaMode(BABYLON.Constants.ALPHA_DISABLE);
		engine.setColorWrite(true);
		engine.setStencilBuffer(false);
		const depth = engine.depthCullingState;
		depth.depthTest = true;
		depth.depthMask = true;
		depth.depthFunc = engine.useReverseDepthBuffer ? BABYLON.Constants.GEQUAL : BABYLON.Constants.LEQUAL;
		depth.zOffset = 0;
		depth.zOffsetUnits = 0;
	}

	private restoreEngineState(engine: BABYLON.AbstractEngine, state: EngineState): void {
		engine.cullBackFaces = state.cullBackFaces;
		engine.setAlphaMode(state.alphaMode);
		engine.setColorWrite(state.colorWrite);
		engine.setStencilBuffer(state.stencilBuffer);
		engine.stencilStateComposer.stencilMaterial = state.stencilMaterial;
		const depth = engine.depthCullingState;
		depth.depthTest = state.depthTest;
		depth.depthMask = state.depthMask;
		depth.depthFunc = state.depthFunc;
		depth.cull = state.cull;
		depth.cullFace = state.cullFace;
		depth.frontFace = state.frontFace;
		depth.zOffset = state.zOffset;
		depth.zOffsetUnits = state.zOffsetUnits;
	}

	private setInvertedHullCulling(entry: QueuedSubMesh): void {
		const material = entry.subMesh.getMaterial()!;
		let orientation = material._getEffectiveOrientation(entry.mesh);
		if (entry.mesh._getWorldMatrixDeterminant() < 0) {
			orientation = orientation === BABYLON.Material.ClockWiseSideOrientation
				? BABYLON.Material.CounterClockWiseSideOrientation
				: BABYLON.Material.ClockWiseSideOrientation;
		}
		const reverseSide = orientation === BABYLON.Material.ClockWiseSideOrientation;
		this.scene.getEngine().setState(true, 0, true, reverseSide, false, undefined, 0);
	}

	private getLocalWidth(mesh: BABYLON.Mesh, worldWidth: number): number {
		if (!mesh.getWorldMatrix().decompose(this.worldScale)) return 0;
		const maxWorldScale = Math.max(Math.abs(this.worldScale.x), Math.abs(this.worldScale.y), Math.abs(this.worldScale.z));
		return maxWorldScale > BABYLON.Epsilon ? worldWidth / maxWorldScale : 0;
	}

	private clearQueue(): void {
		this.queuedSubMeshes.length = 0;
		this.queuedSubMeshSet.clear();
	}

	private removeStageSteps(): void {
		const stage = this.scene._afterRenderingMeshStage;
		for (let i = stage.length - 1; i >= 0; i--) {
			if (stage[i].component === this) stage.splice(i, 1);
		}
	}
}
