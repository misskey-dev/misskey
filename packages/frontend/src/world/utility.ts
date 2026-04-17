/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';

export const WORLD_SCALE = 100;

//export const cm = (value: number) => value / 100;
export const cm = (value: number) => value;

export const TIME_MAP = {
	0: 2,
	1: 2,
	2: 2,
	3: 2,
	4: 2,
	5: 1,
	6: 1,
	7: 0,
	8: 0,
	9: 0,
	10: 0,
	11: 0,
	12: 0,
	13: 0,
	14: 0,
	15: 0,
	16: 1,
	17: 1,
	18: 2,
	19: 2,
	20: 2,
	21: 2,
	22: 2,
	23: 2,
} as const;

export class HorizontalCameraKeyboardMoveInput extends BABYLON.BaseCameraPointersInput {
	public camera: BABYLON.FreeCamera;
	private engine: BABYLON.AbstractEngine;
	private scene: BABYLON.Scene;
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
			const moveSpeed = 0.1 * this.scene.getAnimationRatio();
			const move = dir.scale(moveSpeed * rate);

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

export function normalizeUvToSquare(mesh: BABYLON.Mesh) {
	const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
	const uvIndexes = getPlaneUvIndexes(mesh);
	uvs[uvIndexes[0]] = 0;
	uvs[uvIndexes[0] + 1] = 0;
	uvs[uvIndexes[1]] = 1;
	uvs[uvIndexes[1] + 1] = 0;
	uvs[uvIndexes[2]] = 0;
	uvs[uvIndexes[2] + 1] = 1;
	uvs[uvIndexes[3]] = 1;
	uvs[uvIndexes[3] + 1] = 1;
	mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
}

export function createPlaneUvMapper(mesh: BABYLON.Mesh) {
	mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

	const uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
	const originalUvs = uvs.slice();

	return (srcAspect: number, targetAspect: number, method: 'cover' | 'contain' | 'stretch') => {
		let uScale = 1;
		let vScale = 1;
		const ratio = targetAspect / srcAspect;
		if (method === 'cover') {
			uScale = ratio < 1 ? ratio : 1;
			vScale = ratio < 1 ? 1 : 1 / ratio;
		} else if (method === 'contain') {
			uScale = ratio > 1 ? ratio : 1;
			vScale = ratio > 1 ? 1 : 1 / ratio;
		} else if (method === 'stretch') {
			// nop
		}

		// (0,0)を隅ではなく中心として扱いたいので0.5引いて計算してから最後に0.5足す
		for (let i = 0; i < uvs.length; i += 2) {
			uvs[i] = ((originalUvs[i] - 0.5) * uScale) + 0.5;
			uvs[i + 1] = ((originalUvs[i + 1] - 0.5) * vScale) + 0.5;
		}

		mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
	};
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

// この実装方法だとマイナスの座標をうまく処理できず結果がおかしくなるので応急処置で全体を+10000cmオフセットしてから計算している
export function getMeshesBoundingBox(meshes: BABYLON.Mesh[]): BABYLON.BoundingBox {
	let min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
	let max = new BABYLON.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

	for (const mesh of meshes) {
		const boundingInfo = mesh.getBoundingInfo();
		min = BABYLON.Vector3.Minimize(min, boundingInfo.boundingBox.minimumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
		max = BABYLON.Vector3.Maximize(max, boundingInfo.boundingBox.maximumWorld.add(new BABYLON.Vector3(10000, 10000, 10000)));
	}

	return new BABYLON.BoundingBox(min.subtract(new BABYLON.Vector3(10000, 10000, 10000)), max.subtract(new BABYLON.Vector3(10000, 10000, 10000)));
}
