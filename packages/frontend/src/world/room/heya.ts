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
	walls: {
		n: SimpleHeyaWallBase;
		s: SimpleHeyaWallBase;
		w: SimpleHeyaWallBase;
		e: SimpleHeyaWallBase;
	};
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
	private wallRoots: {
		n: BABYLON.TransformNode;
		s: BABYLON.TransformNode;
		w: BABYLON.TransformNode;
		e: BABYLON.TransformNode;
	} | null = null;
	private wallMaterials: {
		n: BABYLON.PBRMaterial;
		s: BABYLON.PBRMaterial;
		w: BABYLON.PBRMaterial;
		e: BABYLON.PBRMaterial;
	} | null = null;
	private wallHariMaterials: {
		n: BABYLON.PBRMaterial;
		s: BABYLON.PBRMaterial;
		w: BABYLON.PBRMaterial;
		e: BABYLON.PBRMaterial;
	} | null = null;
	private ceilingMaterial: BABYLON.PBRMaterial | null = null;
	private floorMaterial: BABYLON.PBRMaterial | null = null;

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

		this.wallRoots = {
			n: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_N__'))!,
			s: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_S__'))!,
			w: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_W__'))!,
			e: this.loaderResult.transformNodes.find(t => t.name.includes('__WALL_E__'))!,
		};

		const wallMaterial = findMaterial(this.meshes[0], '__X_WALL__');
		this.wallMaterials = {
			n: wallMaterial.clone('wallNMaterial'),
			s: wallMaterial.clone('wallSMaterial'),
			w: wallMaterial.clone('wallWMaterial'),
			e: wallMaterial.clone('wallEMaterial'),
		};

		const hariMaterial = findMaterial(this.meshes[0], '__X_HARI__');
		this.wallHariMaterials = {
			n: hariMaterial.clone('wallNHariMaterial'),
			s: hariMaterial.clone('wallSHariMaterial'),
			w: hariMaterial.clone('wallWHariMaterial'),
			e: hariMaterial.clone('wallEHariMaterial'),
		};

		for (const [k, v] of Object.entries(this.wallRoots)) {
			for (const m of v.getChildMeshes().filter(m => m.material === wallMaterial)) {
				m.material = this.wallMaterials[k];
			}
			for (const m of v.getChildMeshes().filter(m => m.material === hariMaterial)) {
				m.material = this.wallHariMaterials[k];
			}
		}

		this.ceilingMaterial = findMaterial(this.meshes[0], '__X_CEILING__');
		this.floorMaterial = findMaterial(this.meshes[0], '__X_FLOOR__');

		await this.applyOptions(options);
	}

	public applyOptions(options: SimpleHeyaOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		for (const type of ['n', 's', 'w', 'e'] as const) {
			const wallRoot = this.wallRoots[type];
			const wallOptions = options.walls[type];

			for (const mesh of wallRoot.getChildMeshes()) {
				if (mesh.name.includes('__X_HARI__')) {
					mesh.isVisible = wallOptions.withHari;
				} else if (mesh.name.includes('__X_HABAKI__')) {
					mesh.isVisible = wallOptions.withHabaki;
				}
			}

			{
				const targetMaterial = this.wallMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.color);

				const texPath = wallOptions.material === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.material === 'concrete' ? '/client-assets/room/textures/wall-concrete.png'
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
				const targetMaterial = this.wallHariMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.hariColor);

				const texPath = wallOptions.hariMaterial === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.hariMaterial === 'concrete' ? '/client-assets/room/textures/wall-concrete.png'
					: null;

				if (texPath != null) {
					const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
					targetMaterial.albedoTexture = tex;
				} else {
					targetMaterial.albedoTexture = null;
				}

				targetMaterial.freeze();
			}
		}

		{
			this.ceilingMaterial.unfreeze();
			this.ceilingMaterial.albedoColor = new BABYLON.Color3(...options.ceiling.color);

			const texPath = options.ceiling.material === 'wood' ? '/client-assets/room/textures/ceiling-wood.png'
				: options.ceiling.material === 'concrete' ? '/client-assets/room/textures/ceiling-concrete.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				this.ceilingMaterial.albedoTexture = tex;
			} else {
				this.ceilingMaterial.albedoTexture = null;
			}

			this.ceilingMaterial.freeze();
		}

		{
			this.floorMaterial.unfreeze();
			this.floorMaterial.albedoColor = new BABYLON.Color3(...options.flooring.color);

			const texPath = options.flooring.material === 'wood' ? '/client-assets/room/textures/flooring-wood.png'
				: options.flooring.material === 'concrete' ? '/client-assets/room/textures/flooring-concrete.png'
				: null;

			if (texPath != null) {
				const tex = new BABYLON.Texture(texPath, this.meshes[0].getScene(), false, false);
				this.floorMaterial.albedoTexture = tex;
			} else {
				this.floorMaterial.albedoTexture = null;
			}

			this.floorMaterial.freeze();
		}

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
		for (const m of Object.values(this.wallMaterials ?? {})) {
			m.dispose();
		}
		for (const m of Object.values(this.wallHariMaterials ?? {})) {
			m.dispose();
		}
	}
}
