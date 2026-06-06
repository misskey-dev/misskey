
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { findMaterial, GRAPHICS_QUALITY } from '../utility.js';
import { SYSTEM_HEYA_MESH_NAMES } from './utility.js';
import type { RoomEngine } from './engine.js';
import type { SimpleEnvOptions, JapaneseEnvOptions, MuseumEnvOptions, CustomMadoriEnvOptions } from 'misskey-world/src/room/env.js';

export abstract class EnvManager<T = any> {
	protected engine: RoomEngine;
	public abstract envMapIndoor: BABYLON.CubeTexture | null;
	public abstract maxCameraZ: number;
	protected shadowGenerators: BABYLON.ShadowGenerator[] = [];

	constructor(engine: RoomEngine) {
		this.engine = engine;
	}

	abstract load(options: T, scene: BABYLON.Scene, engine: RoomEngine): Promise<void>;
	abstract applyOptions(options: T): void;
	abstract setTime(time: number): void;
	abstract updateRoomLightColor(color: BABYLON.Color3): void;
	abstract turnOnRoomLight(): void;
	abstract turnOffRoomLight(): void;

	public addShadowCaster(mesh: BABYLON.AbstractMesh) {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.addShadowCaster(mesh);
		}
	}

	public removeShadowCaster(mesh: BABYLON.AbstractMesh) {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.removeShadowCaster(mesh);
		}
	}

	protected registerMeshes(meshes: BABYLON.AbstractMesh[]) {
		for (const mesh of meshes) {
			if (!this.engine.scene.meshes.includes(mesh)) this.engine.scene.addMesh(mesh);

			if (SYSTEM_HEYA_MESH_NAMES.some(name => mesh.name.includes(name))) {
				mesh.isPickable = false;
				mesh.receiveShadows = false;
				mesh.isVisible = false;
				mesh.checkCollisions = false;
				if (mesh.name.includes('__COLLISION__')) {
					mesh.checkCollisions = true;
				}
				continue;
			}

			mesh.isPickable = false;
			mesh.checkCollisions = false;
			if (mesh.material != null) {
				(mesh.material as BABYLON.PBRMaterial).useGLTFLightFalloff = true; // Clustered Lightingではphysical falloffを持つマテリアルはアーチファクトが発生する https://doc.babylonjs.com/features/featuresDeepDive/lights/clusteredLighting/#materials-with-a-physical-falloff-may-cause-artefacts

				if (mesh.material instanceof BABYLON.MultiMaterial) {
					for (const subMat of mesh.material.subMaterials) {
						subMat.reflectionTexture = this.envMapIndoor;
					}
				} else if (mesh.material instanceof BABYLON.PBRMaterial) {
					mesh.material.reflectionTexture = this.envMapIndoor;
				}
			}
		}
	}

	public dispose() {
		for (const shadowGen of this.shadowGenerators) {
			shadowGen.dispose();
		}
	}
}
