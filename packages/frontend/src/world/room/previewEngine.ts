/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { GridMaterial } from '@babylonjs/materials';
import { camelToKebab, WORLD_SCALE, cm, getMeshesBoundingBox, Timer } from '../utility.js';
import { getObjectDef } from './object-defs.js';
import { SYSTEM_MESH_NAMES, ModelManager } from './utility.js';
import type { RoomObjectInstance } from './object.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';
import { store } from '@/store.js';

export async function createRoomObjectPreviewEngine(canvas: HTMLCanvasElement) {
	const babylonEngine = new BABYLON.WebGPUEngine(canvas);
	babylonEngine.compatibilityMode = false;
	await babylonEngine.initAsync();
	return new RoomObjectPreviewEngine({ canvas, engine: babylonEngine });
}

export class RoomObjectPreviewEngine {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	private scene: BABYLON.Scene;
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
	private fps: number | null = null;
	private disposed = false;

	constructor(options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
	}) {
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);
		this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
		this.scene.autoClear = true;
		this.scene.skipPointerMovePicking = true;

		this.camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));
		this.envMapIndoor.level = 0.6;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.3;
		//ambientLight.intensity = 0;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(cm(50), cm(249), cm(50)), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(500);
		this.roomLight.radius = cm(30);
		this.roomLight.intensity = 10 * WORLD_SCALE * WORLD_SCALE;

		this.shadowGenerator = new BABYLON.ShadowGenerator(1024, this.roomLight);
		this.shadowGenerator.forceBackFacesOnly = true;
		this.shadowGenerator.bias = 0.0001;
		this.shadowGenerator.usePercentageCloserFiltering = true;
		this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
		this.shadowGenerator.getShadowMap().refreshRate = 60;

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = store.s.darkMode ? new BABYLON.Color3(1, 1, 1) : new BABYLON.Color3(0, 0, 0);
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

		if (_DEV_) {
			window.takeScreenshot = () => {
				const def = getObjectDef(this.objectType);

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

	public async init() {
		if (this.fps == null) {
			this.engine.runRenderLoop(() => {
				this.scene.render();
			});
		} else {
			let then = 0;
			const interval = 1000 / this.fps;

			const renderLoop = (timeStamp: number) => {
				if (this.disposed) return;

				window.requestAnimationFrame(renderLoop);

				const delta = timeStamp - then;
				if (delta <= interval) return;
				then = timeStamp - (delta % interval);

				this.engine.beginFrame();
				this.scene.render();
				this.engine.endFrame();
			};

			window.requestAnimationFrame(renderLoop);
		}
	}

	public async load(type: string) {
		this.clear();

		const id = genId();
		const def = getObjectDef(type);
		this.objectOptions = deepClone(def.options.default);
		for (const [key, value] of Object.entries(def.options.schema)) {
			if (value.type === 'seed') {
				this.objectOptions[key] = Math.floor(Math.random() * 1000);
			}
		}

		await this.loadObject({
			type,
			options: this.objectOptions,
			id,
		});

		// なぜかちょっと待たないとbounding boxのサイズが正しくない
		window.setTimeout(() => {
			const boundingInfo = getMeshesBoundingBox(this.objectMesh!.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));

			this.camera.dispose();

			this.camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
			this.camera.attachControl(this.canvas);
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
			this.camera.setTarget(new BABYLON.Vector3(0, boundingInfo.center.y, 0));

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
			//this.camera.orthoLeft = -distance;
			//this.camera.orthoRight = distance;
			//this.camera.orthoTop = distance;
			//this.camera.orthoBottom = -distance;
		}, 10);

		return {
			id,
			objectInstance: this.objectInstance,
			options: this.objectOptions,
		};
	}

	private async loadObject(args: {
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

		updateMeshes(subRoot.getChildMeshes());

		this.timerForEachObject = new Timer();

		const objectInstance = await def.createInstance({
			room: null,
			scene: this.scene,
			root,
			options: args.options,
			model,
			id: args.id,
			timer: this.timerForEachObject,
		});

		objectInstance.onInited?.();

		this.objectType = args.type;
		this.objectInstance = objectInstance;
		this.objectMesh = root;
	}

	public updateObjectOption(key: string, value: any) {
		this.objectOptions[key] = value;
		this.objectInstance?.onOptionsUpdated?.([key, value]);
		return this.objectOptions;
	}

	public clear() {
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
	}

	public resize() {
		this.engine.resize();
	}

	public destroy() {
		if (this.timerForEachObject != null) {
			this.timerForEachObject.dispose();
		}
		this.engine.dispose();
		this.disposed = true;
	}
}
