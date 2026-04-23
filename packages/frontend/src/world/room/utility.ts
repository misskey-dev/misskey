/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { applyMorphTargetsToMesh, cm, getPlaneUvIndexes, Timer } from '../utility.js';
import type { RoomEngine } from './engine.js';

export const SYSTEM_MESH_NAMES = ['__TOP__', '__SIDE__', '__PICK__', '__COLLISION__'];
export const SYSTEM_HEYA_MESH_NAMES = ['__ROOM_WALL__', '__ROOM_SIDE__', '__ROOM_FLOOR__', '__ROOM_CEILING__', '__ROOM_TOP__', '__ROOM_BOTTOM__'];

export function yuge(scene: BABYLON.Scene, mesh: BABYLON.Mesh, offset: BABYLON.Vector3) {
	const emitter = new BABYLON.TransformNode('emitter', scene);
	emitter.parent = mesh;
	emitter.position = offset;
	const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, scene);
	ps.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
	ps.emitter = emitter;
	ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
	ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
	ps.minEmitPower = cm(10);
	ps.maxEmitPower = cm(12);
	ps.minLifeTime = 2;
	ps.maxLifeTime = 3;
	ps.addSizeGradient(0, cm(10), cm(12));
	ps.addSizeGradient(1, cm(18), cm(20));
	ps.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
	ps.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
	ps.emitRate = 0.5;
	ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
	ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
	ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
	ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
	ps.preWarmCycles = Math.random() * 1000;
	ps.start();

	// dispose
	return () => {
		ps.stop();
		emitter.dispose();
	};
}

export function createOverridedStates<T extends Record<string, (() => any)>>(stateDefs: T): { [K in keyof T]: ReturnType<T[K]>; } & { $reset: () => void } {
	const overridedStates = {} as { [K in keyof T]: ReturnType<T[K]>; };
	const result = {} as { [K in keyof T]: ReturnType<T[K]>; } & { $reset: () => void };

	for (const k in stateDefs) {
		Object.defineProperty(result, k, {
			get() {
				return overridedStates[k] ?? stateDefs[k]();
			},
			set(value) {
				overridedStates[k] = value;
			},
			enumerable: true,
		});
	}

	result.$reset = () => {
		for (const k in stateDefs) {
			overridedStates[k] = stateDefs[k]();
		}
	};

	return result;
}

const TV_PROGRAMS = {
	shopping: {
		textureColumns: 8,
		textureRows: 8,
		timeline: [
			[0, 500],
			[1, 500],
			[0, 500],
			[1, 500],
			[0, 500],
			[1, 500],
			[2, 500],
			[3, 500],
			[2, 500],
			[3, 500],
			[4, 500],
			[5, 500],
			[4, 500],
			[5, 500],
			[6, 500],
			[7, 500],
			[8, 500],
			[9, 500],
			[8, 500],
			[9, 500],
			[2, 500],
			[3, 500],
			[2, 500],
			[3, 500],
		],
	},
} satisfies Record<string, {
	textureColumns: number;
	textureRows: number;
	timeline: [index: number, duration: number][];
}>;

export function initTv(scene: BABYLON.Scene, screenMesh: BABYLON.Mesh, timer: Timer) {
	const tvProgramId = 'shopping';
	const tvProgram = TV_PROGRAMS[tvProgramId];
	const tvScreenMaterial = screenMesh.material as BABYLON.PBRMaterial;
	tvScreenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);
	tvScreenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
	tvScreenMaterial.roughness = 1;
	tvScreenMaterial.emissiveTexture = new BABYLON.Texture(`/client-assets/room/tv/${tvProgramId}/${tvProgramId}.png`, scene, false, false);
	tvScreenMaterial.emissiveTexture.level = 1.0;
	tvScreenMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);

	const uvs = screenMesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
	const uvIndexes = getPlaneUvIndexes(screenMesh);

	const applyTvTexture = (tlIndex: number) => {
		const [index, duration] = tvProgram.timeline[tlIndex];

		screenMesh.material = tvScreenMaterial;

		const aspect = 16 / 9;

		const x = index % tvProgram.textureColumns;
		const y = Math.floor(index / tvProgram.textureColumns);

		const ax = x / tvProgram.textureColumns;
		const ay = y / tvProgram.textureRows / aspect;
		const bx = (x + 1) / tvProgram.textureColumns;
		const by = ay;
		const cx = ax;
		const cy = (y + 1) / tvProgram.textureRows / aspect;
		const dx = bx;
		const dy = cy;

		uvs[uvIndexes[0]] = ax;
		uvs[uvIndexes[0] + 1] = ay;
		uvs[uvIndexes[1]] = bx;
		uvs[uvIndexes[1] + 1] = by;
		uvs[uvIndexes[2]] = cx;
		uvs[uvIndexes[2] + 1] = cy;
		uvs[uvIndexes[3]] = dx;
		uvs[uvIndexes[3] + 1] = dy;
		screenMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);

		timer.setTimeout(() => {
			applyTvTexture((tlIndex + 1) % tvProgram.timeline.length);
		}, duration);
	};

	applyTvTexture(0);

	return {
		dispose() {
		},
	};
}

export function findMaterial(rootMesh: BABYLON.AbstractMesh, keyword: string, allowMultiMaterial = false): BABYLON.PBRMaterial {
	for (const m of rootMesh.getChildMeshes()) {
		if (m.material == null) continue;
		if (m.material instanceof BABYLON.MultiMaterial) {
			if (allowMultiMaterial && m.material.name.includes(keyword)) {
				return m.material as BABYLON.MultiMaterial;
			}

			if ((m.material as BABYLON.MultiMaterial).subMaterials == null) continue;

			for (const sm of (m.material as BABYLON.MultiMaterial).subMaterials) {
				if (sm == null) continue;
				if (sm.name.includes(keyword)) {
					return sm as BABYLON.PBRMaterial;
				}
			}
		} else {
			if (m.material.name.includes(keyword)) {
				return m.material as BABYLON.PBRMaterial;
			}
		}
	}
	throw new Error(`Material with keyword "${keyword}" not found`);
}

export class ModelManager {
	public root: BABYLON.Mesh;
	public bakedCallback: (() => void) | null = null;
	public bakeExcludeMeshes: BABYLON.Mesh[] = [];
	private originalMeshes: BABYLON.Mesh[] = [];
	private bakedMeshes: BABYLON.Mesh[] = [];
	private hasTexture: boolean;

	constructor(root: BABYLON.Mesh, originalMeshes: BABYLON.Mesh[], hasTexture: boolean, bakedCallback: (() => void) | null = null) {
		this.root = root;
		this.originalMeshes = originalMeshes;
		this.hasTexture = hasTexture;
		this.bakedCallback = bakedCallback;
	}

	public findMesh(keyword: string) {
		const mesh = this.root.getChildMeshes().find(m => m.name.includes(keyword));
		if (mesh == null) {
			throw new Error(`Mesh with keyword "${keyword}" not found for object ${this.root.metadata?.objectType}`);
		}
		return mesh as BABYLON.Mesh;
	}

	public findMeshes(keyword: string) {
		const meshes = this.root.getChildMeshes().filter(m => m.name.includes(keyword));
		return meshes as BABYLON.Mesh[];
	}

	public findMaterial(keyword: string) {
		return findMaterial(this.root, keyword);
	}

	public findTransformNode(keyword: string) {
		const node = this.root.getChildTransformNodes().find(n => n.name.includes(keyword));
		if (node == null) {
			throw new Error(`TransformNode with keyword "${keyword}" not found for object ${this.root.metadata?.objectType}`);
		}
		return node;
	}

	public updated() {
	}

	public bakeMesh() {
		for (const m of this.bakedMeshes) {
			m.dispose();
		}
		this.bakedMeshes = [];

		const excludeMeshes = [...this.bakeExcludeMeshes, ...this.root.getChildMeshes().filter(m => SYSTEM_MESH_NAMES.some(s => m.name.includes(s)))];

		const childMeshes = this.root.getChildMeshes().filter(m => !excludeMeshes.some(x => x === m) && m.isVisible && !m.isDisposed());

		if (childMeshes.length <= 1) {
			this.bakedCallback?.([...childMeshes, ...excludeMeshes]);
			return;
		}

		const _toMerge = [] as BABYLON.Mesh[];
		for (const mesh of childMeshes) {
			let fixedMesh = mesh;
			fixedMesh.setEnabled(false);

			if (mesh instanceof BABYLON.InstancedMesh) {
				const sourceMesh = mesh.sourceMesh;
				const realizedMesh = sourceMesh.clone(mesh.name + '_realized', null, true);
				realizedMesh.getScene().removeMesh(realizedMesh);

				realizedMesh.position = mesh.position.clone();
				if (mesh.rotationQuaternion) {
					realizedMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
				} else {
					realizedMesh.rotation = mesh.rotation.clone();
				}
				realizedMesh.scaling = mesh.scaling.clone();
				realizedMesh.parent = mesh.parent;
				realizedMesh.setEnabled(false);

				fixedMesh = realizedMesh;
			}

			_toMerge.push(fixedMesh);
		}

		let hasMorphTarget = false;

		const toMerge = [] as BABYLON.Mesh[];
		for (const mesh of _toMerge) {
			const newMesh = mesh.name.endsWith('_realized') ? mesh : mesh.clone(mesh.name + '_bakeMerged', null, true);
			newMesh.makeGeometryUnique();
			if (newMesh.morphTargetManager != null && newMesh.morphTargetManager.numTargets > 0) {
				hasMorphTarget = true;
				applyMorphTargetsToMesh(newMesh);
				// 消すと選択解除した後に再度選択した時にエンジンがクラッシュする
				//newMesh.morphTargetManager?.dispose();
				//newMesh.morphTargetManager = null;
			}
			if (newMesh.parent === this.root) {
				newMesh.parent = null;
			} else {
				newMesh.setParent(this.root);
				//newMesh.bakeCurrentTransformIntoVertices();
				newMesh.parent = null;
			}
			//newMesh.bakeCurrentTransformIntoVertices();

			if (this.hasTexture) {
				if (newMesh.getVerticesData(BABYLON.VertexBuffer.UVKind) == null) {
					const vertexCount = newMesh.getTotalVertices();
					const uvs = new Array(vertexCount * 2).fill(0);
					newMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, false, 2);
				}
				if (newMesh.getVerticesData(BABYLON.VertexBuffer.UV2Kind) == null) {
					const vertexCount = newMesh.getTotalVertices();
					const uvs = new Array(vertexCount * 2).fill(0);
					newMesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs, false, 2);
				}
			}

			toMerge.push(newMesh);
		}

		if (toMerge.length === 0) {
			this.bakedCallback?.([...childMeshes, ...excludeMeshes]);
			return;
		}

		const merged = BABYLON.Mesh.MergeMeshes(toMerge, true, false, undefined, false, true);
		merged.parent = this.root;
		// 消すと選択解除した後に再度選択した時にエンジンがクラッシュする
		//merged.morphTargetManager?.dispose();
		//merged.morphTargetManager = null;

		if (!hasMorphTarget) { // https://forum.babylonjs.com/t/is-it-intentional-that-morph-targets-do-not-work-on-meshes-with-frozen-materials/63252
			merged.material.freeze();
			if (merged.material instanceof BABYLON.MultiMaterial) {
				for (const subMat of merged.material.subMaterials) {
					(subMat as BABYLON.PBRMaterial).freeze();
				}
			}
		}

		merged.freezeWorldMatrix();
		merged.metadata = { ...this.root.metadata };
		if (!this.hasTexture) merged.convertToUnIndexedMesh();
		this.bakedMeshes = [merged];

		this.bakedCallback?.([...this.bakedMeshes, ...excludeMeshes]);
	}

	public unbakeMesh() {
		for (const m of this.bakedMeshes) {
			m.dispose();
		}
		this.bakedMeshes = [];

		const childMeshes = this.root.getChildMeshes();

		for (const mesh of childMeshes) {
			mesh.setEnabled(true);
		}

		this.bakedCallback?.(this.root.getChildMeshes());
	}
}
