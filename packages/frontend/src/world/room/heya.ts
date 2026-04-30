/* eslint-disable id-denylist */
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

export type SimpleHeyaOptions = {
	dimension: [number, number];
	window: 'none' | 'kosidakamado' | 'demado' | 'hakidasimado';
	walls: Record<'n' | 's' | 'w' | 'e', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		withBeam: boolean;
		beamMaterial: null | 'wood' | 'concrete';
		beamColor: [number, number, number];
		withBaseboard: boolean;
	}>;
	pillars: Record<'nw' | 'ne' | 'sw' | 'se', {
		material: null | 'wood' | 'concrete';
		color: [number, number, number];
		show: boolean;
	}>;
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

// TODO: マテリアルは必要になるまで作成しないようにする

export class SimpleHeyaManager extends HeyaManager<SimpleHeyaOptions> {
	private loaderResult: BABYLON.ISceneLoaderAsyncResult | null = null;
	private meshes: BABYLON.Mesh[] = [];
	private wallRoots: Record<'n' | 's' | 'w' | 'e', BABYLON.TransformNode> = null as any;
	private wallMaterials: Record<'n' | 's' | 'w' | 'e', BABYLON.PBRMaterial> | null = null;
	private wallBeamMaterials: Record<'n' | 's' | 'w' | 'e', BABYLON.PBRMaterial> | null = null;
	private pillarRoots: Record<'nw' | 'ne' | 'sw' | 'se', BABYLON.TransformNode> | null = null;
	private pillarMaterials: Record<'nw' | 'ne' | 'sw' | 'se', BABYLON.PBRMaterial> | null = null;
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

		this.pillarRoots = {
			nw: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_NW__'))!,
			ne: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_NE__'))!,
			sw: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_SW__'))!,
			se: this.loaderResult.transformNodes.find(t => t.name.includes('__PILLAR_SE__'))!,
		};

		const wallMaterial = findMaterial(this.meshes[0], '__WALL__');
		this.wallMaterials = {
			n: wallMaterial.clone('wallNMaterial'),
			s: wallMaterial.clone('wallSMaterial'),
			w: wallMaterial.clone('wallWMaterial'),
			e: wallMaterial.clone('wallEMaterial'),
		};

		const beamMaterial = findMaterial(this.meshes[0], '__BEAM__');
		this.wallBeamMaterials = {
			n: beamMaterial.clone('wallNBeamMaterial'),
			s: beamMaterial.clone('wallSBeamMaterial'),
			w: beamMaterial.clone('wallWBeamMaterial'),
			e: beamMaterial.clone('wallEBeamMaterial'),
		};

		const pillarMaterial = findMaterial(this.meshes[0], '__PILLAR__');
		this.pillarMaterials = {
			nw: pillarMaterial.clone('pillarNWMaterial'),
			ne: pillarMaterial.clone('pillarNEMaterial'),
			sw: pillarMaterial.clone('pillarSWMaterial'),
			se: pillarMaterial.clone('pillarSEMaterial'),
		};

		for (const [k, v] of Object.entries(this.wallRoots)) {
			for (const m of v.getChildMeshes().filter(m => m.material === wallMaterial)) {
				m.material = this.wallMaterials[k];
			}
			for (const m of v.getChildMeshes().filter(m => m.material === beamMaterial)) {
				m.material = this.wallBeamMaterials[k];
			}
		}
		for (const [k, v] of Object.entries(this.pillarRoots)) {
			for (const m of v.getChildMeshes().filter(m => m.material === pillarMaterial)) {
				m.material = this.pillarMaterials[k];
			}
		}

		this.ceilingMaterial = findMaterial(this.meshes[0], '__CEILING__');
		this.floorMaterial = findMaterial(this.meshes[0], '__FLOOR__');

		await this.applyOptions(options);
	}

	public applyOptions(options: SimpleHeyaOptions) {
		// TODO: 返り値をpromiseにしてちゃんとテクスチャが読み終わってからresolveする

		for (const type of ['n', 's', 'w', 'e'] as const) {
			const wallRoot = this.wallRoots[type];
			const wallOptions = options.walls[type];

			for (const mesh of wallRoot.getChildMeshes()) {
				if (mesh.name.includes('__BEAM__')) {
					mesh.setEnabled(wallOptions.withBeam);
				} else if (mesh.name.includes('__BASEBOARD__')) {
					mesh.setEnabled(wallOptions.withBaseboard);
				}
			}

			{
				const targetMaterial = this.wallMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.color);

				const texPath = wallOptions.material === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.material === 'concrete' ? '/client-assets/room/textures/concrete1.png'
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
				const targetMaterial = this.wallBeamMaterials[type];

				targetMaterial.unfreeze();
				targetMaterial.albedoColor = new BABYLON.Color3(...wallOptions.beamColor);

				const texPath = wallOptions.beamMaterial === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
					: wallOptions.beamMaterial === 'concrete' ? '/client-assets/room/textures/concrete1.png'
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

		for (const type of ['nw', 'ne', 'sw', 'se'] as const) {
			const pillarRoot = this.pillarRoots[type];
			const pillarOptions = options.pillars[type];

			let isEnabled = pillarOptions.show;
			if (!isEnabled) {
				// 梁同士が直交することは許さない(z-fightingが発生する)ので柱を強制追加
				if (type === 'nw') {
					isEnabled = options.walls.n.withBeam && options.walls.w.withBeam;
				} else if (type === 'ne') {
					isEnabled = options.walls.n.withBeam && options.walls.e.withBeam;
				} else if (type === 'sw') {
					isEnabled = options.walls.s.withBeam && options.walls.w.withBeam;
				} else if (type === 'se') {
					isEnabled = options.walls.s.withBeam && options.walls.e.withBeam;
				}
			}
			pillarRoot.setEnabled(isEnabled);

			const targetMaterial = this.pillarMaterials[type];

			targetMaterial.unfreeze();
			targetMaterial.albedoColor = new BABYLON.Color3(...pillarOptions.color);

			const texPath = pillarOptions.material === 'wood' ? '/client-assets/room/textures/wall-wood2.png'
				: pillarOptions.material === 'concrete' ? '/client-assets/room/textures/concrete1.png'
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
			this.ceilingMaterial.unfreeze();
			this.ceilingMaterial.albedoColor = new BABYLON.Color3(...options.ceiling.color);

			const texPath = options.ceiling.material === 'wood' ? '/client-assets/room/textures/ceiling-wood.png'
				: options.ceiling.material === 'concrete' ? '/client-assets/room/textures/concrete3.png'
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
				: options.flooring.material === 'concrete' ? '/client-assets/room/textures/concrete3.png'
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
				m.dispose(false, true);
			}
			for (const t of this.loaderResult.transformNodes) {
				t.dispose(false, true);
			}
		}
		for (const m of this.meshes) {
			m.dispose(false, true);
		}
		for (const m of Object.values(this.wallMaterials ?? {})) {
			m.dispose();
		}
		for (const m of Object.values(this.wallBeamMaterials ?? {})) {
			m.dispose();
		}
		for (const m of Object.values(this.pillarMaterials ?? {})) {
			m.dispose();
		}
	}
}
