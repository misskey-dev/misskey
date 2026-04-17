/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { registerBuiltInLoaders } from '@babylonjs/loaders/dynamic.js';
import { GridMaterial } from '@babylonjs/materials';
import { camelToKebab, WORLD_SCALE, cm, getMeshesBoundingBox } from '../utility.js';
import { getObjectDef } from './object-defs.js';
import { SYSTEM_MESH_NAMES, ModelManager } from './utility.js';
import type { RoomObjectInstance } from './object.js';
import { genId } from '@/utility/id.js';
import { deepClone } from '@/utility/clone.js';

export async function createRoomObjectPreviewEngine(canvas: HTMLCanvasElement) {
	//const babylonEngine = new BABYLON.WebGPUEngine(canvas);
	//babylonEngine.compatibilityMode = false;
	//await babylonEngine.initAsync();
	const babylonEngine = new BABYLON.Engine(canvas, false, { alpha: false, antialias: false });
	return new RoomObjectPreviewEngine({ canvas, engine: babylonEngine });
}

export class RoomObjectPreviewEngine {
	private canvas: HTMLCanvasElement;
	private engine: BABYLON.WebGPUEngine;
	private scene: BABYLON.Scene;
	private shadowGenerator1: BABYLON.ShadowGenerator;
	private camera: BABYLON.ArcRotateCamera;
	private objectMesh: BABYLON.Mesh | null = null;
	private objectInstance: RoomObjectInstance<any> | null = null;
	private envMapIndoor: BABYLON.CubeTexture;
	private roomLight: BABYLON.SpotLight;
	private zGridPreviewPlane: BABYLON.Mesh;
	private fps = 60;

	constructor(options: {
		canvas: HTMLCanvasElement;
		engine: BABYLON.WebGPUEngine;
	}) {
		this.canvas = options.canvas;

		registerBuiltInLoaders();

		this.engine = options.engine;
		this.scene = new BABYLON.Scene(this.engine);

		this.scene.ambientColor = new BABYLON.Color3(1.0, 0.9, 0.8);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, cm(300), new BABYLON.Vector3(0, cm(90), 0), this.scene);
		this.camera.attachControl(this.canvas);
		this.camera.minZ = cm(1);
		this.camera.maxZ = cm(100000);
		this.camera.fov = 0.5;
		this.camera.lowerBetaLimit = 0;
		this.camera.upperBetaLimit = (Math.PI / 2) + 0.1;
		this.camera.lowerRadiusLimit = cm(50);
		this.camera.upperRadiusLimit = cm(1000);
		this.camera.useAutoRotationBehavior = true;
		this.camera.autoRotationBehavior!.idleRotationSpeed = 0.3;
		//this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.scene.activeCamera = this.camera;

		const ambientLight = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, -0.5), this.scene);
		ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		ambientLight.intensity = 0.5;
		//ambientLight.intensity = 0;

		this.roomLight = new BABYLON.SpotLight('roomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.scene);
		this.roomLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.8);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);

		this.shadowGenerator1 = new BABYLON.ShadowGenerator(4096, this.roomLight);
		this.shadowGenerator1.forceBackFacesOnly = true;
		this.shadowGenerator1.bias = 0.0001;
		this.shadowGenerator1.usePercentageCloserFiltering = true;
		this.shadowGenerator1.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
		//this.shadowGenerator1.useContactHardeningShadow = true;

		const gridMaterial = new GridMaterial('grid', this.scene);
		gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.5);
		gridMaterial.mainColor = new BABYLON.Color3(0, 0, 0);
		gridMaterial.minorUnitVisibility = 1;
		gridMaterial.opacity = 0.5;
		gridMaterial.gridRatio = cm(10);

		//this.zGridPreviewPlane = BABYLON.MeshBuilder.CreatePlane('zGridPreviewPlane', { width: cm(1000), height: cm(1000) }, this.scene);
		//this.zGridPreviewPlane.material = gridMaterial;
		//this.zGridPreviewPlane.rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);

		//this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
		//this.scene.fogStart = cm(100);
		//this.scene.fogEnd = cm(110);
		//this.scene.fogColor = new BABYLON.Color3(0.0, 0.0, 0.0);
	}

	public async init() {
		const frameInterval = 1000 / this.fps;
		let lastTime = performance.now();

		this.engine.runRenderLoop(() => {
			const currentTime = performance.now();
			const delta = currentTime - lastTime;

			if (delta >= frameInterval) {
				this.scene.render();
				lastTime = currentTime - (delta % frameInterval);
			}
		});
	}

	public async load(type: string) {
		if (this.objectInstance != null) {
			this.objectInstance.dispose?.();
			this.objectInstance = null;
			this.objectMesh!.dispose();
		}

		// reset camera rotation
		this.camera.setPosition(new BABYLON.Vector3(0, cm(90), cm(300)));

		const def = getObjectDef(type);

		const options = deepClone(def.options.default);

		const id = genId();

		await this.loadObject({
			type,
			options,
			id,
		});

		// なぜかちょっと待たないとbounding boxのサイズが正しくない
		window.setTimeout(() => {
			const boundingInfo = getMeshesBoundingBox(this.objectMesh!.getChildMeshes().filter(m => m.isEnabled() && m.isVisible));
			this.camera.setTarget(new BABYLON.Vector3(0, boundingInfo.center.y, 0));

			// zoom to fit
			const size = boundingInfo.extendSize;
			const distance = Math.max(size.x, size.y, size.z) * 2;
			this.camera.radius = distance * 3;
			//this.camera.orthoLeft = -distance;
			//this.camera.orthoRight = distance;
			//this.camera.orthoTop = distance;
			//this.camera.orthoBottom = -distance;
		}, 10);
	}

	// TODO: RoomEngineのものとほぼ同じだからいい感じに共通化
	private async loadObject(args: {
		type: string;
		options: any;
		id: string;
	}) {
		const def = getObjectDef(args.type);

		const root = new BABYLON.Mesh(`object_${args.type}`, this.scene);

		const filePath = def.path != null ? `/client-assets/room/objects/${def.path}.glb` : `/client-assets/room/objects/${camelToKebab(args.type)}/${camelToKebab(args.type)}.glb`;
		const loaderResult = await BABYLON.LoadAssetContainerAsync(filePath, this.scene);

		// 不要なUVを掃除
		if (!def.hasTexture) {
			for (const m of loaderResult.meshes) {
				if (m.geometry != null) {
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UVKind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV2Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV3Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV4Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV5Kind);
					m.geometry.removeVerticesData(BABYLON.VertexBuffer.UV6Kind);
				}
			}
		}

		// babylonによって自動で追加される右手系変換用ノード
		const subRoot = loaderResult.meshes[0];
		subRoot.scaling = subRoot.scaling.scale(WORLD_SCALE);// cmをmに

		def.treatLoaderResult?.(loaderResult);

		root.addChild(subRoot);

		const model = new ModelManager(subRoot, loaderResult.meshes.filter(m => !m.isDisposed() && m !== subRoot), def.hasTexture, (meshes) => {
			for (const m of meshes) {
				const mesh = m;

				// シェイプキー(morph)を考慮してbounding boxを更新するために必要
				mesh.refreshBoundingInfo({ applyMorph: true });

				if (SYSTEM_MESH_NAMES.some(n => mesh.name.includes(n))) {
					mesh.receiveShadows = false;
					mesh.isVisible = false;
				} else {
					if (def.receiveShadows !== false) mesh.receiveShadows = true;
					if (def.castShadows !== false) {
						this.shadowGenerator1.addShadowCaster(mesh);
					}

					if (mesh.material) {
						if (mesh.material instanceof BABYLON.MultiMaterial) {
							for (const subMat of mesh.material.subMaterials) {
								(subMat as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
								(subMat as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
							}
						} else {
							(mesh.material as BABYLON.PBRMaterial).reflectionTexture = this.envMapIndoor;
							(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts
						}
					}
				}

				if (!this.scene.meshes.includes(mesh)) this.scene.addMesh(mesh);
			}
		});

		const objectInstance = await def.createInstance({
			room: null,
			scene: this.scene,
			root,
			options: args.options,
			model,
			id: args.id,
		});

		objectInstance.onInited?.();

		model.bakeMesh();

		this.objectInstance = objectInstance;
		this.objectMesh = root;
	}

	public updateObjectOption(key: string, value: any) {
		this.objectInstance?.onOptionsUpdated?.([key, value]);
	}

	public resize() {
		this.engine.resize();
	}

	public destroy() {
		this.engine.dispose();
	}
}
