
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { findMaterial, GRAPHICS_QUALITY } from '../utility.js';
import { SYSTEM_HEYA_MESH_NAMES } from './utility.js';
import type { RoomEngine } from './engine.js';

export abstract class EnvManager<T = any> {
	protected engine: RoomEngine;
	public abstract envMapIndoor: BABYLON.CubeTexture | null;
	public abstract maxCameraZ: number;
	private shadowGenerators: BABYLON.ShadowGenerator[] = [];
	protected isRoomLightOn = true;

	constructor(engine: RoomEngine) {
		this.engine = engine;
	}

	abstract load(options: T, scene: BABYLON.Scene, engine: RoomEngine): Promise<void>;
	abstract applyOptions(options: T): void;
	abstract setTime(time: number): void;
	abstract applyRoomLight(): void;

	public turnOnRoomLight() {
		this.isRoomLightOn = true;
		this.applyRoomLight();
	}

	public turnOffRoomLight() {
		this.isRoomLightOn = false;
		this.applyRoomLight();
	}

	protected registerShadowGenerator(shadowGenerator: BABYLON.ShadowGenerator) {
		this.shadowGenerators.push(shadowGenerator);

		const shadowMap = shadowGenerator.getShadowMap()!;
		shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

		// https://forum.babylonjs.com/t/is-it-intentional-that-the-shadow-map-refresh-rate-is-ignored-under-fast-snapshot-rendering/63523
		const objectRenderer = shadowMap._objectRenderer;
		const originalShouldRender = objectRenderer.shouldRender.bind(objectRenderer);
		objectRenderer.shouldRender = function () {
			if (this._engine.snapshotRendering) {
				return this.refreshRate !== BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
			}

			return originalShouldRender();
		};
	}

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

	public async renderShadow() {
		this.engine.sr.disableSnapshotRendering();

		for (const shadowGen of this.shadowGenerators) {
			const shadowMap = shadowGen.getShadowMap()!;
			shadowMap.refreshRate = 1;
		}

		await new Promise(resolve => setTimeout(resolve, 1));

		for (const shadowGen of this.shadowGenerators) {
			const shadowMap = shadowGen.getShadowMap()!;
			shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
		}

		this.engine.sr.enableSnapshotRendering();
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
