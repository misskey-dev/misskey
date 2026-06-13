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
import type { MuseumEnvOptions } from 'misskey-world/src/room/env.js';

export class MuseumEnvManager extends EnvManager<MuseumEnvOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private roomLight: BABYLON.DirectionalLight | null = null;
	private subRoomLights: BABYLON.SpotLight[] = [];
	public envMapIndoor: BABYLON.CubeTexture | null = null;
	public maxCameraZ = cm(3000);

	constructor(engine: RoomEngine) {
		super(engine);
	}

	public async load(options: MuseumEnvOptions) {
		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/envs/museum/museum.glb', this.engine.scene);

		this.envMapIndoor = BABYLON.CubeTexture.CreateFromPrefilteredData('/client-assets/room/indoor.env', this.engine.scene);
		this.envMapIndoor.boundingBoxSize = new BABYLON.Vector3(cm(2000), cm(500), cm(2000));

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

		this.roomLight = new BABYLON.DirectionalLight('env:RoomLight', new BABYLON.Vector3(0, -1, 0), this.engine.scene);
		this.roomLight.position = new BABYLON.Vector3(0, cm(300), 0);
		this.roomLight.shadowMinZ = cm(10);
		this.roomLight.shadowMaxZ = cm(500);
		this.roomLight.radius = cm(30);

		if (this.engine.graphicsQuality >= GRAPHICS_QUALITY.MEDIUM) {
			const shadowGeneratorForRoomLight = new BABYLON.ShadowGenerator(this.engine.graphicsQuality <= GRAPHICS_QUALITY.MEDIUM ? 1024 : 2048, this.roomLight);
			shadowGeneratorForRoomLight.forceBackFacesOnly = true;
			shadowGeneratorForRoomLight.bias = 0.00001;
			shadowGeneratorForRoomLight.normalBias = 0.005;
			shadowGeneratorForRoomLight.usePercentageCloserFiltering = true;
			shadowGeneratorForRoomLight.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
			//this.shadowGeneratorForRoomLight.useContactHardeningShadow = true;
			this.registerShadowGenerator(shadowGeneratorForRoomLight);
		}

		for (const node of this.meshes.filter(mesh => mesh.name.includes('__LIGHT__'))) {
			const light = new BABYLON.SpotLight('env:SubRoomLight', node.position, new BABYLON.Vector3(0, -1, 0), 16, 8, this.engine.scene, true);
			light.range = cm(500);
			light.radius = cm(15);
			light.parent = this.meshes[0];
			this.engine.lightContainer.addLight(light);
			this.subRoomLights.push(light);
		}

		this.applyRoomLight();

		for (const mesh of this.meshes) {
			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) continue;
			mesh.receiveShadows = true;
			//this.addShadowCaster(mesh);
		}

		await this.applyOptions(options);
	}

	public setTime(time: number) {
	}

	public applyRoomLight(): void {
		if (this.roomLight == null) return;
		this.roomLight.diffuse = new BABYLON.Color3(...this.engine.roomState.light.color);
		this.roomLight.intensity = 0.00005 * WORLD_SCALE * WORLD_SCALE * this.engine.roomState.light.brightness * (this.isRoomLightOn ? 1 : 0);
		for (const subLight of this.subRoomLights) {
			subLight.diffuse = new BABYLON.Color3(...this.engine.roomState.light.color);
			subLight.intensity = 20 * WORLD_SCALE * WORLD_SCALE * this.engine.roomState.light.brightness * (this.isRoomLightOn ? 1 : 0);
		}
		if (this.envMapIndoor != null) this.envMapIndoor.level = 0.025 + (0.175 * this.engine.roomState.light.brightness * (this.isRoomLightOn ? 1 : 0));
		for (const m of this.engine.scene.materials) {
			if (m.metadata?.disableEnvMap) {
				m.ambientColor = this.isRoomLightOn ? new BABYLON.Color3(0.5, 0.5, 0.5) : new BABYLON.Color3(0.025, 0.025, 0.025);
			}
		}
	}

	public applyOptions(options: MuseumEnvOptions) {
		this.registerMeshes(this.meshes);
	}

	public dispose() {
		this.envMapIndoor?.dispose();
		this.roomLight?.dispose();
		for (const subLight of this.subRoomLights) {
			subLight.dispose();
		}
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		super.dispose();
	}
}
