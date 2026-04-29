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
	withHari: boolean;
	hariMaterial: null | 'wood' | 'concrete';
	hariColor: [number, number, number];
	withHabaki: boolean;
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
	private wallNHariMaterial: BABYLON.PBRMaterial | null = null;
	private wallSHariMaterial: BABYLON.PBRMaterial | null = null;
	private wallWHariMaterial: BABYLON.PBRMaterial | null = null;
	private wallEHariMaterial: BABYLON.PBRMaterial | null = null;

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

		const hariMaterial = findMaterial(this.meshes[0], '__X_HARI__');
		this.wallNHariMaterial = hariMaterial.clone('wallNHariMaterial');
		this.wallSHariMaterial = hariMaterial.clone('wallSHariMaterial');
		this.wallWHariMaterial = hariMaterial.clone('wallWHariMaterial');
		this.wallEHariMaterial = hariMaterial.clone('wallEHariMaterial');

		for (const m of this.wallNRoot.getChildMeshes().filter(m => m.material === hariMaterial)) {
			m.material = this.wallNHariMaterial;
		}
		for (const m of this.wallSRoot.getChildMeshes().filter(m => m.material === hariMaterial)) {
			m.material = this.wallSHariMaterial;
		}
		for (const m of this.wallWRoot.getChildMeshes().filter(m => m.material === hariMaterial)) {
			m.material = this.wallWHariMaterial;
		}
		for (const m of this.wallERoot.getChildMeshes().filter(m => m.material === hariMaterial)) {
			m.material = this.wallEHariMaterial;
		}

		await this.applyOptions(options);
	}

	public applyOptions(options: SimpleHeyaOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		const applyWall = (wall: 'N' | 'S' | 'W' | 'E') => {
			const wallRoot =
				wall === 'N' ? this.wallNRoot :
				wall === 'S' ? this.wallSRoot :
				wall === 'W' ? this.wallWRoot :
				this.wallERoot;

			const wallOptions =
				wall === 'N' ? options.wallN :
				wall === 'S' ? options.wallS :
				wall === 'W' ? options.wallW :
				options.wallE;

			for (const mesh of wallRoot.getChildMeshes()) {
				if (mesh.name.includes('__X_HARI__')) {
					mesh.isVisible = wallOptions.withHari;
				} else if (mesh.name.includes('__X_HABAKI__')) {
					mesh.isVisible = wallOptions.withHabaki;
				}
			}

			{
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
			}

			{
				const targetMaterial =
					wall === 'N' ? this.wallNHariMaterial :
					wall === 'S' ? this.wallSHariMaterial :
					wall === 'W' ? this.wallWHariMaterial :
					this.wallEHariMaterial;

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.hariColor);

				const texPath = wallOptions.hariMaterial === 'wood' ? '/client-assets/room/wall-textures/wood.png'
					: wallOptions.hariMaterial === 'concrete' ? '/client-assets/room/wall-textures/concrete.png'
					: null;

				if (texPath != null) {
					const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
					targetMaterial.albedoTexture = tex;
				} else {
					targetMaterial.albedoTexture = null;
				}

				targetMaterial.freeze();
			}
		};

		applyWall('N');
		applyWall('S');
		applyWall('W');
		applyWall('E');

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
