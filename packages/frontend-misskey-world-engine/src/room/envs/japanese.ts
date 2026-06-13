/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { findMaterial, GRAPHICS_QUALITY } from '../../utility.js';
import { SYSTEM_HEYA_MESH_NAMES } from '../utility.js';
import { EnvManager } from '../env.js';
import type { RoomEngine } from '../engine.js';
import type { JapaneseEnvOptions } from 'misskey-world/src/room/env.js';

export class JapaneseEnvManager extends EnvManager<JapaneseEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private skybox: BABYLON.Mesh | null = null;
	private skyboxMat: BABYLON.StandardMaterial | null = null;
	private roomLight: BABYLON.SpotLight | null = null;
	private sunLight: BABYLON.DirectionalLight | null = null;
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(1000);

	constructor(engine: RoomEngine) {
		super(engine);
	}

	public async load(options: JapaneseEnvOptions) {
		this.skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: cm(1000) }, this.engine.scene);
		this.skyboxMat = new BABYLON.StandardMaterial('skyboxMat', this.engine.scene);
		this.skyboxMat.backFaceCulling = false;
		this.skyboxMat.disableLighting = true;
		this.skybox.material = this.skyboxMat;
		this.skybox.infiniteDistance = true;

		this.roomLight = new BABYLON.SpotLight('env:RoomLight', new BABYLON.Vector3(0, cm(249), 0), new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(300);
		this.roomLight.radius = cm(30);

		this.applyRoomLight();

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			const shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.roomLight);
			shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			shadowGeneratorForRoomLight.bias = 0.0005;
			shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			//shadowGeneratorForRoomLight.useContactHardeningShadow = true;
			//shadowGeneratorForRoomLight.contactHardeningLightSizeUVRatio = 0.01;
			this.registerShadowGenerator(shadowGeneratorForRoomLight);
		}

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			this.sunLight = new BABYLON.DirectionalLight('env:SunLight', new BABYLON.Vector3(0.2, -1, -1), this.engine.scene);
			this.sunLight.position = new BABYLON.Vector3(cm(-20), cm(1000), cm(1000));
			this.sunLight.shadowMinZ = cm(1000);
			this.sunLight.shadowMaxZ = cm(2000);

			const shadowGeneratorForSunLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.sunLight);
			shadowGeneratorForSunLight.forceBackFacesOnly = true;
			shadowGeneratorForSunLight.bias = 0.00001;
			shadowGeneratorForSunLight.usePercentageCloserFiltering = true;
			shadowGeneratorForSunLight.usePoissonSampling = true;
			this.registerShadowGenerator(shadowGeneratorForSunLight);
		}

		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/envs/japanese/japanese.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(500), cm(500), cm(500));

		this.meshes = this.loaderResult.meshes.filter(m => m instanceof BABYLON.Mesh);
		this.meshes[0].scaling = this.meshes[0].scaling.scale(WORLD_SCALE);
		this.meshes[0].rotationQuaternion = null;
		this.meshes[0].rotation = new BABYLON.Vector3(0, 0, 0);

		// instanced mesh を通常の mesh に変換 (そうしないとマテリアルが共有される)
		for (const mesh of this.loaderResult.meshes) {
			if (mesh instanceof BABYLON.InstancedMesh) {
				const realizedMesh = mesh.sourceMesh.clone(mesh.name, null, true);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;

				mesh.dispose();
				this.engine.scene.removeMesh(mesh);
				this.meshes.push(realizedMesh);
			}
		}

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;

			this.addShadowCaster(mesh);
		}

		await this.applyOptions(options);
	}

	public setTime(time: number) {
		if (this.skyboxMat == null) return;

		if (time === 0) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.7, 0.9, 1.0);
		} else if (time === 1) {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.8, 0.5, 0.3);
		} else {
			this.skyboxMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.2);
		}

		if (this.sunLight != null) {
			this.sunLight.diffuse = time === 0 ? new BABYLON.Color3(1.0, 0.9, 0.8) : time === 1 ? new BABYLON.Color3(1.0, 0.8, 0.6) : new BABYLON.Color3(0.6, 0.8, 1.0);
			this.sunLight.intensity = time === 0 ? 3 : time === 1 ? 1 : 0.25;
		}
	}

	public applyRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.light.color);
		this.roomLight.intensity = 18 * WORLD_SCALE * WORLD_SCALE * this.engine.roomState.light.brightness * (this.isRoomLightOn ? 1 : 0);
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025 + (0.575 * this.engine.roomState.light.brightness * (this.isRoomLightOn ? 1 : 0));
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = this.isRoomLightOn ? new BABYLON.Color3(0.5, 0.5, 0.5) : new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: JapaneseEnvOptions) {
		this.registerMeshes(this.meshes);
	}

	public dispose() {
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		this.skybox?.dispose();
		this.skyboxMat?.dispose();
		this.envMapIndoor?.dispose();
		this.roomLight?.dispose();
		this.sunLight?.dispose();
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		super.dispose();
	}
}
