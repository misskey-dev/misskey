/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { FreeCameraManualInput, GRAPHICS_QUALITY, Timer } from './utility.js';
import { TIME_MAP } from './utility.js';
import { MultiplayEngineBase } from './MultiplayEngineBase.js';
import { CelShadingRenderer } from './CelShadingRenderer.js';
import { LobbyEnvManager } from './envs/lobby.js';
import type { PlayerContainer, PlayerProfile, PlayerState } from './PlayerContainer.js';
import type { WorldEnvManager } from './env.js';

const IN_WEB_WORKER = typeof window === 'undefined';

export class WorldEngine extends MultiplayEngineBase<{
	'changeMyPlayerState': (ctx: PlayerState) => void;
	'playerPointed': (ctx: { playerId: string; }) => void;
	'playSfxUrl': (ctx: {
		url: string;
		options: {
			volume: number;
			playbackRate: number;
		};
	}) => void;
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
}> {
	private dayPeriod: 0 | 1 | 2 = 0; // 0: 昼, 1: 夕, 2: 夜
	public lightContainer: BABYLON.ClusteredLightContainer;
	public sr: BABYLON.SnapshotRenderingHelper;
	public readonly celShadingRenderer: CelShadingRenderer;
	public gl: BABYLON.GlowLayer | null = null;
	public timer: Timer = new Timer();
	private useGlow: boolean;
	public graphicsQuality: number;
	private envManager: WorldEnvManager | null = null;
	private inited = false;

	constructor(options: {
		babylonEngine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
		antialias: boolean;
		fov: number;
		useVirtualJoystick?: boolean;
		showUsernameOnAvatar: boolean;
		show2dAvatarOnAvatar: boolean;
	}) {
		super({
			babylonEngine: options.babylonEngine,
			fps: options.fps,
			showUsernameOnAvatar: options.showUsernameOnAvatar,
			show2dAvatarOnAvatar: options.show2dAvatarOnAvatar,
			useVirtualJoystick: options.useVirtualJoystick ?? false,
			fov: options.fov,
			fastMovement: true,
		});

		this.graphicsQuality = options.graphicsQuality;
		this.useGlow = this.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM;

		registerBuiltInLoaders();

		this.scene.autoClear = false;
		//this.scene.autoClearDepthAndStencil = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため
		this.scene.gravity = new BABYLON.Vector3(0, -0.1, 0).scale(WORLD_SCALE);
		this.scene.collisionsEnabled = true;

		this.celShadingRenderer = new CelShadingRenderer(this.scene, {
			enabled: true,
			color: new BABYLON.Color3(0.5, 0.6, 0.7),
			width: cm(2),
		});
		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		this.dayPeriod = TIME_MAP[new Date().getHours() as keyof typeof TIME_MAP];
		//this.time = TIME_MAP[12 as keyof typeof TIME_MAP];

		this.scene.ambientColor = new BABYLON.Color3(0.9, 0.9, 0.9);

		this.lightContainer = new BABYLON.ClusteredLightContainer('clustered', [], this.scene);
		this.lightContainer.maxRange = cm(10000);
		this.lightContainer.verticalTiles = 32;
		this.lightContainer.horizontalTiles = 32;
		this.lightContainer.depthSlices = 32;

		if (this.useGlow) {
			this.gl = new BABYLON.GlowLayer('glow', this.scene, {
				//mainTextureFixedSize: 512,
				blurKernelSize: 64,
			});
			this.gl.intensity = 0.5;
			this.scene.setRenderingAutoClearDepthStencil(this.gl.renderingGroupId, false);
			this.sr.updateMeshesForEffectLayer(this.gl);
		}

		if (this.graphicsQuality >= GRAPHICS_QUALITY.HIGH) {
			const pipeline = new BABYLON.DefaultRenderingPipeline('default', true, this.scene);
			if (options.antialias) {
				pipeline.samples = 4;
			}

			pipeline.bloomEnabled = true;
			pipeline.bloomThreshold = 0.95;
			pipeline.bloomWeight = 0.3;
			pipeline.bloomKernel = 256;
			pipeline.bloomScale = 2;

			pipeline.sharpenEnabled = true;
			pipeline.sharpen.edgeAmount = 0.5;
		}
	}

	public async init() {
		await this.loadEnv();

		this.startRenderLoop();

		await this.scene.whenReadyAsync();

		// 必ずシーンが少なくとも1フレームレンダリングがされてから呼ばれるように注意すること。そうしないとタイミングによってはエンジンがクラッシュする
		this.sr.enableSnapshotRendering();

		this.inputs.on('wheel', (ev) => {
			if (this.scene.activeCamera === this.camera) {
				this.camera.fov += ev.deltaY * 0.001;
				this.camera.fov = Math.max(0.25, Math.min(this.fov, this.camera.fov));
			}
		});

		this.inputs.on('zoom', (ev) => {
			if (this.scene.activeCamera === this.camera) {
				this.camera.fov += -ev.delta * 0.003;
				this.camera.fov = Math.max(0.25, Math.min(this.fov, this.camera.fov));
			}
		});

		this.inputs.on('click', (ev) => {
			// TODO: GPUPickerを使いたいが、なぜか一部のメッシュが反応しない
			const pickingInfo = this.scene.pick(ev.x, ev.y,
				(m) => m.name.includes('__PICK__') || m.metadata?.isPlayer || (m.isVisible && m.isEnabled() && m.metadata?.furnitureId != null && this.furnitureContainers.has(m.metadata.furnitureId)));

			if (pickingInfo.pickedMesh != null) {
				const playerId = pickingInfo.pickedMesh.metadata.playerId;
				if (playerId != null && this.playerContainers.some(c => c.id === playerId)) {
					const c = this.playerContainers.find(c => c.id === playerId)!;
					this.look(c.root.position);
					this.ev('playerPointed', { playerId });
					return;
				}
			}
		});

		this.inputs.on('pointer', (ev) => {
			if (this.scene.activeCamera === this.camera) {
				(this.camera.inputs.attached.manual as FreeCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
			}
		});

		this.timer.setInterval(() => {
			const camera = this.scene.activeCamera!;
			const myPos = camera.globalPosition;
			const myRotation = camera.absoluteRotation.toEulerAngles();
			this.ev('changeMyPlayerState', {
				position: [myPos.x, myPos.y, myPos.z],
				rotation: [myRotation.x, myRotation.y, myRotation.z],
			});
		}, 100);

		this.inited = true;
	}

	private async loadEnv() {
		const envManager = new LobbyEnvManager(this);

		await envManager.load();
		envManager.applyDayPeriod(this.dayPeriod);

		for (const mat of this.scene.materials) {
			mat.unfreeze();
			if (mat instanceof BABYLON.MultiMaterial) {
				for (const subMat of mat.subMaterials) {
					if (subMat.metadata?.useEnvMap) subMat.reflectionTexture = envManager.envMapIndoor;
				}
			} else {
				if (mat.metadata?.useEnvMap) mat.reflectionTexture = envManager.envMapIndoor;
			}
		}

		this.envManager = envManager;

		this.camera.maxZ = this.envManager.maxCameraZ;
	}

	public getEnvMap(): BABYLON.CubeTexture | null {
		return this.envManager?.envMapIndoor ?? null;
	}

	public cameraMove(vector: { x: number; y: number; }, dash: boolean) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(dash ? { x: vector.x * 3, y: vector.y * 3 } : vector);
	}

	public cameraJoystickMove(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.manual as FreeCameraManualInput).setMoveVector(vector);
	}

	private playSfxUrl(url: string, options: { volume: number; playbackRate: number }) {
		this.emit('playSfxUrl', { url, options });
	}

	public clearPlayers() {
		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.destroy();
		}
		this.sr.enableSnapshotRendering();
		this.playerContainers = [];
	}

	public updateAvatarDisplayOptions(options: { showUsername: boolean; show2dAvatar: boolean }) {
		this.showUsernameOnAvatar = options.showUsername;
		this.show2dAvatarOnAvatar = options.show2dAvatar;

		this.sr.disableSnapshotRendering();
		for (const playerContainer of this.playerContainers) {
			playerContainer.updateUserInfoDisplayOptions(options);
		}
		this.sr.enableSnapshotRendering();
	}

	public resize() {
		this.babylonEngine.resize(true);
	}

	public destroy() {
		this.celShadingRenderer.dispose();
		super.destroy();
		this.timer.dispose();
		this.envManager.dispose();
	}
}
