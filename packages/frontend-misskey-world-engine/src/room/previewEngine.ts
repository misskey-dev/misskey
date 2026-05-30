/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { GridMaterial } from '@babylonjs/materials';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { camelToKebab } from 'misskey-world/src/utility.js';
import { getMeshesBoundingBox, ArcRotateCameraManualInput, GRAPHICS_QUALITY } from '../utility.js';
import { EngineBase } from '../EngineBase.js';
import { deepClone } from '../clone.js';
import { genId } from '../id.js';
import { getObjectDef } from './object-defs.js';
import { SYSTEM_MESH_NAMES } from './utility.js';
import { ObjectContainer } from './ObjectContainer.js';
import type { RawOptions } from './object.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';

export class RoomObjectPreviewEngine extends EngineBase<{
	'loadingProgress': (ctx: { progress: number }) => void;
	'contextlost': (ctx: { reason: string; message: string; }) => void;
}> {
	private sr: BABYLON.SnapshotRenderingHelper;
	private shadowGenerator: BABYLON.ShadowGenerator;
	private camera: BABYLON.ArcRotateCamera;
	private objectContainer: ObjectContainer | null = null;
	private objectOptions: RawOptions | null = null;
	private envMapIndoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	private zGridPreviewPlane: BABYLON.Mesh;
	private pipeline: BABYLON.DefaultRenderingPipeline;
	private graphicsQuality: number;

	constructor(options: {
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

		this.scene.autoClear = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため
		this.scene.clearColor = new BABYLON.Color4(0.03, 0.03, 0.03, 1);

		this.sr = new BABYLON.SnapshotRenderingHelper(this.scene);

		this.camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);

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

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = new BABYLON.Color3(1, 1, 1);
		gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		gridMaterial.minorUnitVisibility = 1;
		gridMaterial.opacity = 0.05;
		gridMaterial.gridRatio = cm(10);

		this.zGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('zGridPreviewPlane', { width: cm(300), height: cm(300) }, this.scene);
		this.zGridPreviewPlane.material = gridMaterial;
		this.zGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);

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

		if (_DEV_ && typeof window !== 'undefined') {
			window.takeScreenshot = () => {
				const def = getObjectDef(this.objectContainer.type);

				this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
				this.scene.autoClear = true;
				this.sr.disableSnapshotRendering();
				this.pipeline.dispose();

				const boundingInfo = getMeshesBoundingBox(this.objectContainer.root.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));

				const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 4, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
				camera.inputs.clear();
				camera.minZ = cm(1);
				camera.maxZ = cm(100000);
				camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
				camera.setTarget(boundingInfo.center);
				if (def.placement === 'wall' || def.placement === 'side') {
				} else if (def.placement === 'ceiling' || def.placement === 'bottom') {
					camera.beta = Math.PI / 1.75;
				} else {
				}

				// zoom to fit
				const size = boundingInfo.extendSize;
				const distance = Math.max(size.x, size.y, size.z) * 3;
				camera.orthoTop = (distance / 2);
				camera.orthoBottom = -(distance / 2);
				camera.orthoLeft = -(distance / 2);
				camera.orthoRight = (distance / 2);

				this.scene.activeCamera = camera;

				this.zGridPreviewPlane.isVisible = false;

				window.setTimeout(() => {
					BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, camera, { width: 256, height: 256 }, undefined, undefined, undefined, true, `${camelToKebab(this.objectContainer.type!)}.png`);
				}, 100);
			};
		}
	}

	public async init() {
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

		//if (_DEV_) { // SR状態確認用
		//	const box = BABYLON.MeshBuilder.CreateBox('', { size: cm(10) }, this.scene);
		//	setInterval(() => {
		//		box.position = new BABYLON.Vector3(0, Math.random() * cm(10), 0);
		//	}, 10);
		//}
	}

	public async loadObject(type: string) {
		this.sr.disableSnapshotRendering();
		this.clearObject();

		const id = genId();
		const def = getObjectDef(type);
		this.objectOptions = deepClone(def.options.default);
		for (const [key, value] of Object.entries(def.options.schema)) {
			if (value.type === 'seed') {
				this.objectOptions[key] = Math.floor(Math.random() * 1000);
			}
		}

		this.objectContainer = new ObjectContainer({
			id: id,
			type: type,
			position: new BABYLON.Vector3(0, 0, 0),
			rotation: new BABYLON.Vector3(0, 0, 0),
			options: this.objectOptions,
			roomAttachments: { files: [] },
			sr: this.sr,
			getIsSrReady: () => true,
			lightContainer: null,
			graphicsQuality: this.graphicsQuality,
			scene: this.scene,
		});
		this.objectContainer.registerMeshes = (meshes) => {
			for (const mesh of meshes) {
				// シェイプキー(morph)を考慮してbounding boxを更新するために必要
				mesh.refreshBoundingInfo({ applyMorph: true });

				if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (def.receiveShadows !== false) mesh.receiveShadows = true;
					if (def.castShadows !== false) {
						this.shadowGenerator.addShadowCaster(mesh);
					}

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
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}
		};

		await this.objectContainer.load();

		const boundingInfo = getMeshesBoundingBox(this.objectContainer.root.getChildMeshes().filter(m => m.isEnabled() && m.isVisible), true);

		this.pipeline.removeCamera(this.camera);
		this.camera.dispose();

		this.camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 0.5;
		this.camera.lowerRadiusLimit = cm(50);
		this.camera.upperRadiusLimit = cm(1000);
		this.camera.useAutoRotationBehavior = true;
		this.camera.autoRotationBehavior!.idleRotationSpeed = 0.3;
		//this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.camera.setTarget(new BABYLON.Vector3(0, boundingInfo.centerWorld.y, 0));
		this.camera.inputs.clear();

		this.camera.inputs.add(new ArcRotateCameraManualInput(this.scene, {
			rotationSensitivity: 0.0005,
		}));

		if (def.placement === 'wall' || def.placement === 'side') {
			this.camera.lowerBetaLimit = 0;
			this.camera.upperBetaLimit = Math.PI;
			this.zGridPreviewPlane.rotation = new BABYLON.Vector3(0, Math.PI, 0);
		} else if (def.placement === 'ceiling' || def.placement === 'bottom') {
			this.camera.lowerBetaLimit = (Math.PI / 2) - 0.1;
			this.camera.upperBetaLimit = Math.PI;
			this.camera.beta = Math.PI / 1.75;
			this.zGridPreviewPlane.rotation = new BABYLON.Vector3(-Math.PI / 2, 0, 0);
		} else {
			this.camera.lowerBetaLimit = 0;
			this.camera.upperBetaLimit = (Math.PI / 2) + 0.1;
			this.zGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
		}

		// zoom to fit
		const size = boundingInfo.extendSize;
		const distance = Math.max(size.x, size.y, size.z) * 2;
		this.camera.radius = distance * 3;

		this.pipeline.addCamera(this.camera);

		this.sr.enableSnapshotRendering();

		return {
			id,
			options: this.objectOptions,
		};
	}

	public updateObjectOption(key: string, value: any, attachments?: RoomAttachments) {
		if (this.objectOptions == null) return;
		this.objectOptions[key] = value;

		if (this.objectContainer != null) {
			this.objectContainer.optionsUpdated(this.objectOptions, key, value, attachments ?? { files: [] });
		}
	}

	public clearObject() {
		this.sr.disableSnapshotRendering();
		if (this.objectContainer != null) {
			this.objectContainer.destroy();
			this.objectContainer = null;
			this.objectOptions = null;
		}
		this.sr.enableSnapshotRendering();
	}

	public cameraRotate(vector: { x: number; y: number; }) {
		(this.camera.inputs.attached.manual as ArcRotateCameraManualInput).setRotationVector(vector);
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
		this.objectContainer?.destroy();
	}
}
