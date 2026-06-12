/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { ArcRotateCameraManualInput, getMeshesBoundingBox, GRAPHICS_QUALITY } from './utility.js';
import { PlayerContainer, type PlayerProfile } from './PlayerContainer.js';
import { EngineBase } from './EngineBase.js';
import { deepClone } from './clone.js';
import type { WorldAvatar } from 'misskey-world/src/types.js';

export class AvatarPreviewEngine extends EngineBase<{ // PlayerPreviewEngineに改名した方がいいかもしれない
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
}> {
	private sr: BABYLON.SnapshotRenderingHelper;
	private shadowGenerator: BABYLON.ShadowGenerator;
	private camera: BABYLON.ArcRotateCamera;
	private avatarOptions: WorldAvatar | null = null;
	private playerContainer: PlayerContainer | null = null;
	private envMapIndoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	private pipeline: BABYLON.DefaultRenderingPipeline;
	private graphicsQuality: number;
	private profile: PlayerProfile;

	constructor(profile: PlayerProfile, options: {
		engine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
	}) {
		super({
			engine: options.engine,
			fps: options.fps,
		});

		registerBuiltInLoaders();

		this.graphicsQuality = options.graphicsQuality;
		this.profile = deepClone(profile);

		this.scene.autoClear = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため
		this.scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.01, 1);

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		this.camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 0.5;
		this.camera.lowerRadiusLimit = cm(50);
		this.camera.upperRadiusLimit = cm(1000);
		this.camera.inputs.clear();
		this.camera.inputs.add(new ArcRotateCameraManualInput(this.scene, {
			rotationSensitivity: 0.0005,
		}));

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));
		this.envMapIndoor.level = 0.6;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(cm(50), cm(249), cm(50)), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(500);
		this.roomLight.radius = cm(30);
		this.roomLight.intensity = 15 * WORLD_SCALE * WORLD_SCALE;

		this.shadowGenerator = new BABYLON.ShadowGenerator(2048, this.roomLight);
		this.shadowGenerator.forceBackFacesOnly = true;
		this.shadowGenerator.bias = 0.0001;
		this.shadowGenerator.usePercentageCloserFiltering = true;
		this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
		this.shadowGenerator.getShadowMap().refreshRate = 60;

		const gl = new BABYLON.GlowLayer('glow', this.scene, {
			blurKernelSize: 64,
		});
		gl.intensity = 0.5;
		this.scene.setRenderingAutoClearDepthStencil(gl.renderingGroupId, false);
		this.sr.updateMeshesForEffectLayer(gl);

		this.pipeline = new BABYLON.DefaultRenderingPipeline('default', true, this.scene);
		this.pipeline.samples = 4;
		if (this.graphicsQuality >= GRAPHICS_QUALITY.HIGH) {
			this.pipeline.bloomEnabled = true;
			this.pipeline.bloomThreshold = 0.95;
			this.pipeline.bloomWeight = 0.1;
			this.pipeline.bloomKernel = 256;
			this.pipeline.bloomScale = 2;
		}
		this.pipeline.sharpenEnabled = true;
		this.pipeline.sharpen.edgeAmount = 0.5;
	}

	public async init() {
		this.startRenderLoop();

		await this.scene.whenReadyAsync();
		this.sr.enableSnapshotRendering();

		this.inputs.on('wheel', (ev) => {
			this.camera.fov += ev.deltaY * 0.0005;
			this.camera.fov = Math.max(0.25, Math.min(0.5, this.camera.fov));
		});

		this.inputs.on('zoom', (ev) => {
			this.camera.fov += -ev.delta * 0.0015;
			this.camera.fov = Math.max(0.25, Math.min(0.5, this.camera.fov));
		});

		this.inputs.on('pointer', (ev) => {
			(this.camera.inputs.attached.manual as ArcRotateCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
		});

		await this.load();
	}

	private async load() {
		this.sr.disableSnapshotRendering();

		this.playerContainer = new PlayerContainer({
			id: '',
			profile: this.profile,
			state: {
				position: [0, 0, 0],
				rotation: [0, 0, 0],
			},
			sr: this.sr,
			scene: this.scene,
			showUsername: false,
			show2dAvatar: false,
		});
		this.playerContainer.registerMeshes = (meshes) => {
			for (const mesh of meshes) {
				mesh.receiveShadows = true;
				this.shadowGenerator.addShadowCaster(mesh);

				if (mesh.material) {
					if (mesh.material instanceof BABYLON.MultiMaterial) {
						for (const subMat of mesh.material.subMaterials) {
							(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
							(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							(subMat as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
						}
					} else {
						(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
						(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
						(mesh.material as BABYLON.PBRMaterial).anisotropy.isEnabled = false; // なんかきれいにレンダリングされないため
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}
		};

		await this.playerContainer.loadAvatar();

		const boundingInfo = getMeshesBoundingBox(this.playerContainer.root.getChildMeshes().filter(m => m.isEnabled() && m.isVisible), true);

		this.camera.setTarget(new BABYLON.Vector3(0, boundingInfo.centerWorld.y, 0));

		// zoom to fit
		const size = boundingInfo.extendSize;
		const distance = Math.max(size.x, size.y, size.z) * 2;
		this.camera.radius = distance * 5;

		this.sr.enableSnapshotRendering();
	}

	public clearPlayer() {
		this.sr.disableSnapshotRendering();
		if (this.playerContainer != null) {
			this.playerContainer.destroy();
			this.playerContainer = null;
		}
		this.sr.enableSnapshotRendering();
	}

	public async updateAvatar(value: WorldAvatar) {
		this.profile.avatar = value;
		this.clearPlayer();
		await this.load();
	}

	public resize() {
		// 一旦snapshot renderingを無効にしておかないとエラーが出る(babylonのバグ？)
		// ~~...が、一旦無効にしたらしたで複数のマテリアルがそれぞれ入れ替わる(?)という謎の現象が発生するためコメントアウトしとく(エラー出てもレンダリングが止まったりするわけでもないし)~~
		// ↑追記: engine.resizeした後に一瞬待つことで回避できることが判明
		this.sr.disableSnapshotRendering();
		this.engine.resize(true);
		// workerで実行される可能性がある

		setTimeout(() => {
			this.sr.enableSnapshotRendering();
		}, 1);
	}

	public destroy() {
		super.destroy();
		this.playerContainer?.destroy();
	}
}
