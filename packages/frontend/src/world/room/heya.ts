/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { WORLD_SCALE } from '../utility.js';
import { findMaterial } from './utility.js';

//export interface HeyaManager<T = any> {
//	constructor(onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null): void;
//	load: (options: T, scene: BABYLON.Scene) => Promise<void>;
//	applyOptions: (options: T) => void;
//	dispose: () => void;
//}

export abstract class HeyaManager<T = any> {
	protected onMeshUpdatedCallback: ((meshes: BABYLON.AbstractMesh[]) => void) | null = null;

	constructor(onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		this.onMeshUpdatedCallback = onMeshUpdatedCallback ?? null;
	}

	abstract load(options: T, scene: BABYLON.Scene): Promise<void>;
	abstract applyOptions(options: T): void;
	abstract dispose(): void;
}

type SimpleHeyaWallBase = {
	material: null | 'wood' | 'concrete';
	color: [number, number, number];
};

export type SimpleHeyaOptions = {
	dimension: [number, number];
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
	wallN: SimpleHeyaWallBase;
	wallE: SimpleHeyaWallBase;
	wallS: SimpleHeyaWallBase;
	wallW: SimpleHeyaWallBase;
	flooring: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
	ceiling: {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
	};
};

export type JapaneseHeyaOptions = {
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
};

export class SimpleHeyaManager extends HeyaManager<SimpleHeyaOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private wallNRoot: BABYLON.TransformNode | null = null;
	private wallSRoot: BABYLON.TransformNode | null = null;
	private wallWRoot: BABYLON.TransformNode | null = null;
	private wallERoot: BABYLON.TransformNode | null = null;
	private wallNMaterial: BABYLON.PBRMaterial | null = null;
	private wallSMaterial: BABYLON.PBRMaterial | null = null;
	private wallWMaterial: BABYLON.PBRMaterial | null = null;
	private wallEMaterial: BABYLON.PBRMaterial | null = null;

	constructor(onMeshUpdatedCallback?: ((meshes: BABYLON.AbstractMesh[]) => void) | null) {
		super(onMeshUpdatedCallback);
	}

	public async load(options: SimpleHeyaOptions, scene: BABYLON.Scene) {
		this.loaderResult = await BABYLON.ImportMeshAsync('/client-assets/room/rooms/default/300.glb', scene);

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
				scene.removeMesh(mesh);
				this.meshes.push(realizedMesh);
			}
		}

		this.wallNRoot = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_N__'))!;
		this.wallSRoot = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_S__'))!;
		this.wallWRoot = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_W__'))!;
		this.wallERoot = this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_E__'))!;

		const wallMaterial = findMaterial(this.meshes[0], '__X_WALL__');
		this.wallNMaterial = wallMaterial.clone('wallNMaterial');
		this.wallSMaterial = wallMaterial.clone('wallSMaterial');
		this.wallWMaterial = wallMaterial.clone('wallWMaterial');
		this.wallEMaterial = wallMaterial.clone('wallEMaterial');

		for (const m of this.wallNRoot.getChildMeshes().filter(m => m.material === wallMaterial)) {
			m.material = this.wallNMaterial;
		}
		for (const m of this.wallSRoot.getChildMeshes().filter(m => m.material === wallMaterial)) {
			m.material = this.wallSMaterial;
		}
		for (const m of this.wallWRoot.getChildMeshes().filter(m => m.material === wallMaterial)) {
			m.material = this.wallWMaterial;
		}
		for (const m of this.wallERoot.getChildMeshes().filter(m => m.material === wallMaterial)) {
			m.material = this.wallEMaterial;
		}

		await this.applyOptions(options);
	}

	public applyOptions(options: SimpleHeyaOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		const apply = (wall: 'N' | 'S' | 'W' | 'E') => {
			const wallOptions =
				wall === 'N' ? options.wallN :
				wall === 'S' ? options.wallS :
				wall === 'W' ? options.wallW :
				options.wallE;
			const targetMaterial =
				wall === 'N' ? this.wallNMaterial :
				wall === 'S' ? this.wallSMaterial :
				wall === 'W' ? this.wallWMaterial :
				this.wallEMaterial;

			targetMaterial.unfreeze();

			targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.color);

			const texPath = wallOptions.material === 'wood' ? '/client-assets/room/wall-textures/wood.png'
				: wallOptions.material === 'concrete' ? '/client-assets/room/wall-textures/concrete.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				targetMaterial.albedoTexture = tex;
			} else {
				targetMaterial.albedoTexture = null;
			}

			targetMaterial.freeze();
		};

		apply('N');
		apply('S');
		apply('W');
		apply('E');

		this.onMeshUpdatedCallback?.(this.meshes);
	}

	public dispose() {
		if (this.loaderResult != null) {
			for (const m of this.loaderResult.meshes) {
				m.dispose();
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose();
			}
		}
		for (const m of this.meshes) {
			m.dispose();
		}
		this.wallNMaterial?.dispose();
		this.wallSMaterial?.dispose();
		this.wallWMaterial?.dispose();
		this.wallEMaterial?.dispose();
	}
}
