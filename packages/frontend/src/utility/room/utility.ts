/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import type { RoomEngine } from './engine.js';

export function yuge(scene: BABYLON.Scene, mesh: BABYLON.Mesh, offset: BABYLON.Vector3) {
	const emitter = new BABYLON.TransformNode('emitter', scene);
	emitter.parent = mesh;
	emitter.position = offset;
	const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, scene);
	ps.particleTexture = new BABYLON.Texture('/client-assets/room/steam.png');
	ps.emitter = emitter;
	ps.minEmitBox = new BABYLON.Vector3(-1/*cm*/, 0, -1/*cm*/);
	ps.maxEmitBox = new BABYLON.Vector3(1/*cm*/, 0, 1/*cm*/);
	ps.minEmitPower = 10;
	ps.maxEmitPower = 12;
	ps.minLifeTime = 2;
	ps.maxLifeTime = 3;
	ps.addSizeGradient(0, 10/*cm*/, 12/*cm*/);
	ps.addSizeGradient(1, 18/*cm*/, 20/*cm*/);
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

const _assumedFramesPerSecond = 60;

export class HorizontalCameraKeyboardMoveInput extends BABYLON.BaseCameraPointersInput {
	public camera: BABYLON.FreeCamera;
	private engine: BABYLON.AbstractEngine;
	private scene: BABYLON.Scene;
	moveSpeed = 6 / _assumedFramesPerSecond;
	preShift = false;
	codes = [];
	codesUp = ['KeyW'];
	codesDown = ['KeyS'];
	codesLeft = ['KeyA'];
	codesRight = ['KeyD'];
	onCanvasBlurObserver = null;
	onKeyboardObserver = null;
	public canMove = true;

	constructor(camera: BABYLON.UniversalCamera) {
		super();
		this.camera = camera;
		this.scene = this.camera.getScene();
		this.engine = this.scene.getEngine();
	}

	attachControl() {
		if (this.onCanvasBlurObserver) {
			return;
		}

		this.onCanvasBlurObserver = this.engine.onCanvasBlurObservable.add(() => {
			this.codes = [];
		});

		this.onKeyboardObserver = this.scene.onKeyboardObservable.add(({ event, type }) => {
			const { code, shiftKey } = event;
			this.preShift = shiftKey;

			if (type === BABYLON.KeyboardEventTypes.KEYDOWN) {
				if (this.codesUp.indexOf(code) >= 0 ||
					this.codesDown.indexOf(code) >= 0 ||
					this.codesLeft.indexOf(code) >= 0 ||
					this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index < 0) { // 存在しなかったら追加する
						this.codes.push({ code });
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			} else {
				if (this.codesUp.indexOf(code) >= 0 ||
					this.codesDown.indexOf(code) >= 0 ||
					this.codesLeft.indexOf(code) >= 0 ||
					this.codesRight.indexOf(code) >= 0) {
					const index = this.codes.findIndex(v => v.code === code);
					if (index >= 0) { // 存在したら削除する
						this.codes.splice(index, 1);
					}
					event.preventDefault();
					(event as KeyboardEvent).stopPropagation();
				}
			}
		});
	}

	detachControl() {
		this.codes = [];

		if (this.onKeyboardObserver) this.scene.onKeyboardObservable.remove(this.onKeyboardObserver);
		if (this.onCanvasBlurObserver) this.engine.onCanvasBlurObservable.remove(this.onCanvasBlurObserver);
		this.onKeyboardObserver = null;
		this.onCanvasBlurObserver = null;
	}

	checkInputs() {
		if (!this.onKeyboardObserver) {
			return;
		}
		for (let index = 0; index < this.codes.length; index++) {
			const { code } = this.codes[index];

			const local = new BABYLON.Vector3();
			if (this.codesLeft.indexOf(code) >= 0) {
				local.x += -1;
			} else if (this.codesUp.indexOf(code) >= 0) {
				local.z += this.scene.useRightHandedSystem ? -1 : 1;
			} else if (this.codesRight.indexOf(code) >= 0) {
				local.x += 1;
			} else if (this.codesDown.indexOf(code) >= 0) {
				local.z += this.scene.useRightHandedSystem ? 1 : -1;
			}

			if (local.length() === 0) {
				continue;
			}

			const dir = this.camera.getDirection(local.normalize());
			dir.y = 0;
			dir.normalize();
			const rate = this.preShift ? 3 : 1;
			const move = dir.scale(this.moveSpeed * rate);

			if (this.canMove) {
				this.camera.cameraDirection.addInPlace(move);
			}
		}
	}

	getClassName() {
		return 'HorizontalCameraKeyboardMoveInput';
	}

	getSimpleName() {
		return 'horizontalkeyboard';
	}
}

const nanasegNumberMap = [
	['a', 'b', 'c', 'd', 'e', 'f'], // 0
	['b', 'c'], // 1
	['a', 'b', 'd', 'e', 'g'], // 2
	['a', 'b', 'c', 'd', 'g'], // 3
	['b', 'c', 'f', 'g'], // 4
	['a', 'c', 'd', 'f', 'g'], // 5
	['a', 'c', 'd', 'e', 'f', 'g'], // 6
	['a', 'b', 'c'], // 7
	['a', 'b', 'c', 'd', 'e', 'f', 'g'], // 8
	['a', 'b', 'c', 'd', 'f', 'g'], // 9
];

export function get7segMeshesOfCurrentTime(meshes: {
	'1a'?: BABYLON.AbstractMesh;
	'1b'?: BABYLON.AbstractMesh;
	'1c'?: BABYLON.AbstractMesh;
	'1d'?: BABYLON.AbstractMesh;
	'1e'?: BABYLON.AbstractMesh;
	'1f'?: BABYLON.AbstractMesh;
	'1g'?: BABYLON.AbstractMesh;
	'2a'?: BABYLON.AbstractMesh;
	'2b'?: BABYLON.AbstractMesh;
	'2c'?: BABYLON.AbstractMesh;
	'2d'?: BABYLON.AbstractMesh;
	'2e'?: BABYLON.AbstractMesh;
	'2f'?: BABYLON.AbstractMesh;
	'2g'?: BABYLON.AbstractMesh;
	'3a'?: BABYLON.AbstractMesh;
	'3b'?: BABYLON.AbstractMesh;
	'3c'?: BABYLON.AbstractMesh;
	'3d'?: BABYLON.AbstractMesh;
	'3e'?: BABYLON.AbstractMesh;
	'3f'?: BABYLON.AbstractMesh;
	'3g'?: BABYLON.AbstractMesh;
	'4a'?: BABYLON.AbstractMesh;
	'4b'?: BABYLON.AbstractMesh;
	'4c'?: BABYLON.AbstractMesh;
	'4d'?: BABYLON.AbstractMesh;
	'4e'?: BABYLON.AbstractMesh;
	'4f'?: BABYLON.AbstractMesh;
	'4g'?: BABYLON.AbstractMesh;
}) {
	const now = new Date();
	const h = now.getHours();
	const m = now.getMinutes();

	const chars = [Math.floor(h / 10), h % 10, Math.floor(m / 10), m % 10];

	const result: BABYLON.AbstractMesh[] = [];

	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];
		const segs = nanasegNumberMap[char];
		for (const seg of segs) {
			const mesh = meshes[`${i + 1}${seg}`];
			if (mesh) {
				result.push(mesh);
			}
		}
	}

	return result;
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

let tvScreenMaterial: BABYLON.StandardMaterial | null = null;

export function initTv(room: RoomEngine, screenMesh: BABYLON.Mesh) {
	const tvProgramId = 'shopping';
	const tvProgram = TV_PROGRAMS[tvProgramId];
	if (tvScreenMaterial == null) {
		tvScreenMaterial = new BABYLON.StandardMaterial('tvScreenMaterial', room.scene);
		tvScreenMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		tvScreenMaterial.emissiveTexture = new BABYLON.Texture(`/client-assets/room/tv/${tvProgramId}/${tvProgramId}.png`, room.scene, false, false);
		tvScreenMaterial.emissiveTexture.level = 0.5;
		tvScreenMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
		tvScreenMaterial.freeze();
	}

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

		const timeoutId = window.setTimeout(() => {
			room.timeoutIds = room.timeoutIds.filter(id => id !== timeoutId);
			applyTvTexture((tlIndex + 1) % tvProgram.timeline.length);
		}, duration);
		room.timeoutIds.push(timeoutId);
	};

	applyTvTexture(0);
}

/**
 *     0         1
 * 0 a(x,y) --- b(x,y)
 *     |         |
 * 1 c(x,y) --- d(x,y)
 */
export function getPlaneUvIndexes(mesh: BABYLON.Mesh) {
	const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
	if (uvs == null) {
		throw new Error('Mesh does not have UV data');
	}

	let aIndex = 0;
	let bIndex = 0;
	let cIndex = 0;
	let dIndex = 0;

	for (let i = 0; i < 8; i += 2) {
		const x = uvs[i];
		const y = uvs[i + 1];

		// 多少ずれがあってもいいように(例えばblenderではUV展開時にデフォルトでわずかなマージンを追加する)、中心より大きいか/小さいかで判定する
		if (x < 0.5 && y < 0.5) {
			aIndex = i;
		} else if (x > 0.5 && y < 0.5) {
			bIndex = i;
		} else if (x < 0.5 && y > 0.5) {
			cIndex = i;
		} else if (x > 0.5 && y > 0.5) {
			dIndex = i;
		}
	}

	return [aIndex, bIndex, cIndex, dIndex];
}

export function createPlaneUvMapper(mesh: BABYLON.Mesh) {
	mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

	const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
	const uvIndexes = getPlaneUvIndexes(mesh);

	const ax = uvs[uvIndexes[0]];
	const ay = uvs[uvIndexes[0] + 1];
	const bx = uvs[uvIndexes[1]];
	const by = uvs[uvIndexes[1] + 1];
	const cx = uvs[uvIndexes[2]];
	const cy = uvs[uvIndexes[2] + 1];
	const dx = uvs[uvIndexes[3]];
	const dy = uvs[uvIndexes[3] + 1];

	return (srcAspect: number, targetAspect: number, method: 'cover' | 'contain' | 'stretch') => {
		let newAx = ax;
		let newAy = ay;
		let newBx = bx;
		let newBy = by;
		let newCx = cx;
		let newCy = cy;
		let newDx = dx;
		let newDy = dy;

		if (method === 'cover') {
			const ratio = targetAspect / srcAspect;

			let uRange: number;
			let vRange: number;

			if (ratio < 1) {
				uRange = ratio; // < 1
				vRange = 1;
			} else {
				uRange = 1;
				vRange = 1 / ratio; // < 1
			}

			const uMin = (1 - uRange) / 2;
			const uMax = uMin + uRange;
			const vMin = (1 - vRange) / 2;
			const vMax = vMin + vRange;

			newAx = uMin;
			newBx = uMax;
			newCx = uMin;
			newDx = uMax;

			newAy = 1 - vMax;
			newBy = 1 - vMax;
			newCy = 1 - vMin;
			newDy = 1 - vMin;
		} else if (method === 'contain') {
			const ratio = targetAspect / srcAspect;

			let uRange: number;
			let vRange: number;

			if (ratio > 1) {
				uRange = ratio; // > 1
				vRange = 1;
			} else {
				uRange = 1;
				vRange = 1 / ratio; // > 1
			}

			const uMin = (1 - uRange) / 2;
			const uMax = uMin + uRange;
			const vMin = (1 - vRange) / 2;
			const vMax = vMin + vRange;

			newAx = uMin;
			newBx = uMax;
			newCx = uMin;
			newDx = uMax;

			newAy = 1 - vMax;
			newBy = 1 - vMax;
			newCy = 1 - vMin;
			newDy = 1 - vMin;
		} else if (method === 'stretch') {
			// nop
		}

		uvs[uvIndexes[0]] = newAx;
		uvs[uvIndexes[0] + 1] = newAy;
		uvs[uvIndexes[1]] = newBx;
		uvs[uvIndexes[1] + 1] = newBy;
		uvs[uvIndexes[2]] = newCx;
		uvs[uvIndexes[2] + 1] = newCy;
		uvs[uvIndexes[3]] = newDx;
		uvs[uvIndexes[3] + 1] = newDy;

		mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
	};
}

export function findMaterial(rootMesh: BABYLON.AbstractMesh, keyword: string): BABYLON.PBRMaterial {
	for (const m of rootMesh.getChildMeshes()) {
		if (m.material == null) continue;
		if (m.material.name.includes(keyword)) {
			return m.material as BABYLON.PBRMaterial;
		} else if ((m.material as BABYLON.MultiMaterial).subMaterials != null) {
			for (const sm of (m.material as BABYLON.MultiMaterial).subMaterials) {
				if (sm == null) continue;
				if (sm.name.includes(keyword)) {
					return sm as BABYLON.PBRMaterial;
				}
			}
		}
	}
	throw new Error(`Material with keyword "${keyword}" not found`);
}

export function scaleMorph(mesh: BABYLON.Mesh, scale: [number, number, number], offset: [number, number, number] = [0, 0, 0]) {
	if (!mesh.morphTargetManager) {
		return;
	}

	const morphTargetManager = mesh.morphTargetManager;

	for (let targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
		const target = morphTargetManager.getTarget(targetIndex);
		const newPos = target.getPositions();
		for (let i = 0; i < newPos.length; i += 3) {
			newPos[i] = (newPos[i] + offset[0]) * scale[0];
			newPos[i + 1] = (newPos[i + 1] + offset[1]) * scale[1];
			newPos[i + 2] = (newPos[i + 2] + offset[2]) * scale[2];
		}
		target.setPositions(newPos);
	}

	morphTargetManager.synchronize();

	mesh.refreshBoundingInfo();
	mesh.computeWorldMatrix(true);
}

export function applyMorphTargetsToMesh(mesh: BABYLON.Mesh) {
	if (!mesh.morphTargetManager) {
		return;
	}

	const morphTargetManager = mesh.morphTargetManager;
	const positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

	if (!positions) {
		return;
	}

	// Create a copy of the original positions to work with
	const finalPositions = positions.slice();

	// Apply each morph target
	for (let targetIndex = 0; targetIndex < morphTargetManager.numTargets; targetIndex++) {
		const target = morphTargetManager.getTarget(targetIndex);
		const influence = target.influence;

		if (influence === 0) {
			continue;
		}

		// Get the morph target positions
		const targetPositions = target.getPositions();

		if (!targetPositions || targetPositions.length !== positions.length) {
			console.warn(`Morph target ${targetIndex} has invalid position data`);
			continue;
		}

		// Apply the morph target influence to each vertex
		for (let i = 0; i < positions.length; i++) {
			finalPositions[i] += (targetPositions[i] - positions[i]) * influence;
		}
	}

	// Update the mesh with the morphed positions
	mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, finalPositions);

	//// Update normals if available
	//const normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
	//if (normals) {
	//	// For simplicity, we'll just recompute the normals
	//	mesh.createNormals(true);
	//}

	// Refresh the mesh
	mesh.refreshBoundingInfo();
	mesh.computeWorldMatrix(true);
}

// ex) hangingTShirt -> hanging-t-shirt
export const camelToKebab = (s: string) => {
	return s
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
		.toLowerCase();
};
