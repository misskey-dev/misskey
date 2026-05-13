/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { GridMaterial } from '@babylonjs/materials';
import EventEmitter from 'eventemitter3';
import { camelToKebab, WORLD_SCALE, cm, getMeshesBoundingBox, Timer, sleep, ArcRotateCameraManualInput } from '../utility.js';
import { getObjectDef } from './object-defs.js';
import { SYSTEM_MESH_NAMES, ModelManager, GRAPHICS_QUALITY } from './utility.js';
import type { RoomObjectInstance } from './object.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

// TODO: RoomEngineBaseとしてabstract classを抽出
export class RoomObjectPreviewEngine extends EventEmitter {
	private engine: BABYLON.WebGPUEngine;
	private scene: BABYLON.Scene;
	private sr: BABYLON.SnapshotRenderingHelper;
	private shadowGenerator: BABYLON.ShadowGenerator;
	private camera: BABYLON.ArcRotateCamera;
	private objectMesh: BABYLON.Mesh | null = null;
	private objectInstance: RoomObjectInstance | null = null;
	private objectOptions: any = null;
	private objectType: string | null = null;
	private envMapIndoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	private zGridPreviewPlane: BABYLON.Mesh;
	private timerForEachObject: Timer | null = null;
	private pipeline: BABYLON.DefaultRenderingPipeline;
	private graphicsQuality: number;
	private fps: number | null = null;
	private disposed = false;

	public inputs: EventEmitter<{
		'click': (event: { x: number; y: number; }) => void;
		'keydown': (event: { code: string; shiftKey: boolean; }) => void;
		'keyup': (event: { code: string; shiftKey: boolean; }) => void;
		'wheel': (event: { deltaY: number; }) => void;
		'pointer': (event: { x: number; y: number; }) => void;
	}> = new EventEmitter();

	constructor(options: {
		engine: BABYLON.WebGPUEngine;
		graphicsQuality: number;
		fps: number | null;
	}) {
		super();

		registerBuiltInLoaders();

		this.graphicsQuality = options.graphicsQuality;
		this.fps = options.fps;

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.autoClear = false;
		this.scene.skipPointerMovePicking = true;
		this.scene.skipFrustumClipping = true; // snapshot renderingでは全てのメッシュがアクティブになっている必要があるため

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
				const def = getObjectDef(this.objectType);

				this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
				this.scene.autoClear = true;
				this.sr.disableSnapshotRendering();
				this.pipeline.dispose();

				const boundingInfo = getMeshesBoundingBox(this.objectMesh!.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));

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
					BABYLON.Tools.CreateScreenshotUsingRenderTarget(this.engine, camera, { width: 256, height: 256 }, undefined, undefined, undefined, true, `${camelToKebab(this.objectType!)}.png`);
				}, 100);
			};
		}
	}

	private currentRafId: number | null = null;

	private startRenderLoop() {
		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				// workerで実行される可能性がある
				this.currentRafId = requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			// workerで実行される可能性がある
			this.currentRafId = requestAnimationFrame(renderLoop);
		}
	}

	public pauseRender() { // TODO: srと同じく参照カウント方式にした方が便利そう
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
	}

	public resumeRender() {
		this.startRenderLoop();
	}

	public async init() {
		await this.scene.whenReadyAsync();
		this.sr.enableSnapshotRendering();

		this.inputs.on('wheel', (ev) => {
			this.camera.fov += ev.deltaY * 0.0005;
			this.camera.fov = Math.max(0.25, Math.min(0.5, this.camera.fov));
		});

		this.inputs.on('pointer', (ev) => {
			(this.camera.inputs.attached.manual as ArcRotateCameraManualInput).setRotationVector({ x: ev.x, y: ev.y });
		});
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

		await this.loadObject_({
			type,
			options: this.objectOptions,
			id,
		});

		const boundingInfo = getMeshesBoundingBox(this.objectMesh!.getChildMeshes().filter(m => m.isEnabled() && m.isVisible), true);

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
		this.camera.panningSensibility = 0;
		this.camera.wheelDeltaPercentage = 0.01;
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

	private async loadObject_(args: {
		type: string;
		options: any;
		id: string;
	}) {
		const def = getObjectDef(args.type);

		const root = new BABYLON.Mesh(`object_${args.type}`, this.scene);

		const filePath = def.path != null ? `/client-assets/room/objects/${def.path}.glb` : `/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// babylonによって自動で追加される右手系変換用ノード
		const subRoot = loaderResult.meshes[0];
		subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに

		def.treatLoaderResult?.(loaderResult);

		root.addChild(subRoot);

		const updateMeshes = (meshes: BABYLON.AbstractMesh[]) => {
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

		const model = new ModelManager(subRoot, loaderResult.meshes.filter(m => !m.isDisposed() && m !== subRoot), def.hasTexture, (meshes) => {
			updateMeshes(meshes);
		});
		//model.updatedCallback = () => {
		//	this.sr.disableSnapshotRendering();
		//	this.sr.enableSnapshotRendering();
		//};

		updateMeshes(subRoot.getChildMeshes());

		this.timerForEachObject = new Timer();

		const objectInstance = await def.createInstance({
			scene: this.scene,
			sr: {
				updateMesh: (mesh) => {
					this.sr.updateMesh(mesh);
				},
				reset: () => {
					this.sr.disableSnapshotRendering();
					this.sr.enableSnapshotRendering();
				},
				fixParticleSystem: (ps) => this.sr.fixParticleSystem(ps),
			},
			root,
			options: args.options,
			model,
			id: args.id,
			timer: this.timerForEachObject,
			graphicsQuality: GRAPHICS_QUALITY.MEDIUM,
		});

		objectInstance.onInited?.();

		this.objectType = args.type;
		this.objectInstance = objectInstance;
		this.objectMesh = root;
	}

	public updateObjectOption(key: string, value: any) {
		this.sr.disableSnapshotRendering();
		this.objectOptions[key] = value;
		this.objectInstance?.onOptionsUpdated?.([key, value]);
		this.sr.enableSnapshotRendering();
		return this.objectOptions;
	}

	public clearObject() {
		this.sr.disableSnapshotRendering();
		if (this.timerForEachObject != null) {
			this.timerForEachObject.dispose();
			this.timerForEachObject = null;
		}
		if (this.objectInstance != null) {
			this.objectInstance.dispose?.();
			this.objectInstance = null;
			this.objectOptions = null;
			this.objectMesh!.dispose();
			this.objectMesh = null;
			this.objectType = null;
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
		// eslint-disable-next-line no-restricted-globals
		setTimeout(() => {
			this.sr.enableSnapshotRendering();
		}, 1);
	}

	public destroy() {
		this.engine.stopRenderLoop();
		if (this.currentRafId != null) {
			// workerで実行される可能性がある
			cancelAnimationFrame(this.currentRafId);
			this.currentRafId = null;
		}
		if (this.timerForEachObject != null) {
			this.timerForEachObject.dispose();
		}
		this.engine.dispose();
		this.scene.dispose();
		this.disposed = true;
	}
}
