/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';

export const WORLD_SCALE = 1;

// cm to meter. 二重に適用しないように注意すること。
export const cm = (value: number) => value / 100;

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

export function randomRange(min: number, max: number) {
	return Math.random() * (max - min) + min;
}

export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

const TEXT_TEXTURE_CHAR_COLS = 16;
const TEXT_TEXTURE_CHAR_ROWS = 16;

const TEXT_TEXTURE_CHAR_MAP = {
	'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25, ' ': 26,
	'a': 32, 'b': 33, 'c': 34, 'd': 35, 'e': 36, 'f': 37, 'g': 38, 'h': 39, 'i': 40, 'j': 41, 'k': 42, 'l': 43, 'm': 44, 'n': 45, 'o': 46, 'p': 47, 'q': 48, 'r': 49, 's': 50, 't': 51, 'u': 52, 'v': 53, 'w': 54, 'x': 55, 'y': 56, 'z': 57,
	'0': 64, '1': 65, '2': 66, '3': 67, '4': 68, '5': 69, '6': 70, '7': 71, '8': 72, '9': 73, '.': 74, ',': 75, ':': 76, ';': 77, '!': 78, '?': 79,
	'+': 80, '-': 81, '=': 82, '_': 83, '*': 84, '(': 85, ')': 86, '/': 87, '#': 88, '@': 89,
	'■': 255,
};

const TEXT_TEXTURE_CHAR_WIDTH_MAP = {
	'A': 0.7, 'B': 0.7, 'C': 0.7, 'D': 0.7, 'E': 0.7, 'F': 0.7, 'G': 0.7, 'H': 0.7, 'I': 0.4, 'J': 0.6, 'K': 0.7, 'L': 0.6, 'M': 0.8, 'N': 0.7, 'O': 0.7, 'P': 0.7, 'Q': 0.7, 'R': 0.7, 'S': 0.7, 'T': 0.7, 'U': 0.7, 'V': 0.7, 'W': 0.9, 'X': 0.7, 'Y': 0.7, 'Z': 0.7, ' ': 0.4,
	'a': 0.6, 'b': 0.6, 'c': 0.6, 'd': 0.6, 'e': 0.6, 'f': 0.4, 'g': 0.6, 'h': 0.6, 'i': 0.3, 'j': 0.3, 'k': 0.6, 'l': 0.3, 'm': 0.9, 'n': 0.6, 'o': 0.6, 'p': 0.6, 'q': 0.6, 'r': 0.4, 's': 0.6, 't': 0.4, 'u': 0.6, 'v': 0.6, 'w': 0.8, 'x': 0.6, 'y': 0.6, 'z': 0.6,
	'0': 0.6, '1': 0.6, '2': 0.6, '3': 0.6, '4': 0.6, '5': 0.6, '6': 0.6, '7': 0.6, '8': 0.6, '9': 0.6,
	'+': 0.6,
};

export class RecyvlingText {
	public maxChars: number;
	public size: number;
	public dir: 'left' | 'right';
	public root: BABYLON.TransformNode;
	public meshs: BABYLON.Mesh[] = [];

	constructor(maxChars: number, scene: BABYLON.Scene, options: {
		size: number;
		dir: 'left' | 'right';
		material: BABYLON.StandardMaterial;
	}) {
		this.maxChars = maxChars;
		this.size = options.size;
		this.dir = options.dir;

		this.root = new BABYLON.TransformNode('textMeshsGroup', scene);

		for (let i = 0; i < maxChars; i++) {
			const plane = BABYLON.MeshBuilder.CreatePlane('plane', {
				size: options.size,
				sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				updatable: true,
			}, scene);
			plane.material = options.material;
			plane.parent = this.root;
			this.meshs.push(plane);
		}

		this.write('');
	}

	public write(text: string) {
		// padding text
		if (text.length < this.maxChars) {
			const padding = ' '.repeat(this.maxChars - text.length);
			text = this.dir === 'left' ? text + padding : padding + text;
		}

		let totalWidth = 0;
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const charWidth = TEXT_TEXTURE_CHAR_WIDTH_MAP[char] ?? 1;
			totalWidth += this.size * charWidth;
		}

		let xPos = 0;

		for (let i = 0; i < text.length; i++) {
			const char = this.dir === 'left' ? text[i] : text[text.length - i - 1];
			const index = TEXT_TEXTURE_CHAR_MAP[char];
			const charWidth = TEXT_TEXTURE_CHAR_WIDTH_MAP[char] ?? 1;
			const x = index % TEXT_TEXTURE_CHAR_COLS;
			const y = Math.floor(index / TEXT_TEXTURE_CHAR_COLS);

			if (this.dir === 'left') {
				xPos += (this.size * charWidth);
			} else if (this.dir === 'right') {
				xPos -= (this.size * charWidth);
			}

			const plane = this.meshs[i];
			const uvs = plane.getVerticesData(BABYLON.VertexBuffer.UVKind);
			uvs[0] = uvs[6] = x / TEXT_TEXTURE_CHAR_COLS;
			uvs[1] = uvs[3] = (y + 1) / TEXT_TEXTURE_CHAR_ROWS;
			uvs[2] = uvs[4] = (x + 1) / TEXT_TEXTURE_CHAR_COLS;
			uvs[5] = uvs[7] = y / TEXT_TEXTURE_CHAR_ROWS;
			plane.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
			plane.position = new BABYLON.Vector3(xPos, 0, 0);
		}
	}

	public getMeshAt(index: number) {
		return this.meshs[index];
	}
}

export class RecyvlingTextGrid {
	public facesCount: number;
	public mesh: BABYLON.Mesh;
	private uvs: BABYLON.FloatArray;
	private currentText = '';
	private meshFlipped: boolean;
	private repeatSeparator: string;

	/* (non-flipped)
		a   d--e
		| \  \ |
		b--c   f
	*/
	/* (flipped)
		a--b  d
		| /  / |
		c   e--f
	*/
	private aIndex = 0;
	private bIndex = 0;
	private cIndex = 0;
	private dIndex = 0;
	private eIndex = 0;
	private fIndex = 0;

	private verticesCountPerFace = 6; // ひとつの四角はふたつの三角に分割されるので 3*2=6

	constructor(mesh: BABYLON.Mesh, facesCount: number, options: {
		meshFlipped: boolean;
		material: BABYLON.StandardMaterial;
		repeatSeparator?: string;
	}) {
		this.mesh = mesh;
		this.mesh.material = options.material;
		this.mesh.convertToUnIndexedMesh();
		this.mesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		this.facesCount = facesCount;
		this.uvs = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
		this.meshFlipped = options.meshFlipped;
		this.repeatSeparator = options.repeatSeparator ?? ' ■ ';

		for (let j = 0; j < (this.verticesCountPerFace * 2); j += 2) {
			const x = this.uvs[j];
			const y = this.uvs[j + 1];

			// 多少ずれがあってもいいように(例えばblenderではUV展開時にデフォルトでわずかなマージンを追加する)、中心より大きいか/小さいかで判定する
			// また、すべての面が同じ頂点構造である前提としている
			if (this.meshFlipped) {
				// ひとつの四角はふたつの三角に分割される。右下に来る三角(d-e-f)の方が先にくるっぽい
				if (j >= 6) {
					if (x < 0.5 && y < 0.5) {
						this.aIndex = j;
					} else if (x > 0.5 && y < 0.5) {
						this.bIndex = j;
					} else if (x < 0.5 && y > 0.5) {
						this.cIndex = j;
					}
				} else {
					if (x > 0.5 && y < 0.5) {
						this.dIndex = j;
					} else if (x < 0.5 && y > 0.5) {
						this.eIndex = j;
					} else if (x > 0.5 && y > 0.5) {
						this.fIndex = j;
					}
				}
			} else {
				if (j >= 6) {
					if (x < 0.5 && y < 0.5) {
						this.aIndex = j;
					} else if (x < 0.5 && y > 0.5) {
						this.bIndex = j;
					} else if (x > 0.5 && y > 0.5) {
						this.cIndex = j;
					}
				} else {
					if (x < 0.5 && y < 0.5) {
						this.dIndex = j;
					} else if (x > 0.5 && y < 0.5) {
						this.eIndex = j;
					} else if (x > 0.5 && y > 0.5) {
						this.fIndex = j;
					}
				}
			}
		}

		//this.write('');
	}

	public write(text: string) {
		this.currentText = text;

		const charIndexes: number[] = [];

		let maxRepeat = Math.ceil(this.facesCount / text.length);
		if (maxRepeat > 1) {
			text += this.repeatSeparator;
			maxRepeat = Math.ceil(this.facesCount / text.length);
		}

		for (let i = 0; i < this.facesCount; i++) {
			if (i + text.length >= (maxRepeat * text.length)) {
				if (i >= this.facesCount - this.repeatSeparator.length) {
					charIndexes.push(TEXT_TEXTURE_CHAR_MAP[this.repeatSeparator[(i - (this.facesCount - this.repeatSeparator.length)) % this.repeatSeparator.length]]);
				} else {
					charIndexes.push(TEXT_TEXTURE_CHAR_MAP[' ']);
				}
				continue;
			} else if (i >= text.length) {
				const char = text[i % text.length];
				const index = TEXT_TEXTURE_CHAR_MAP[char] ?? TEXT_TEXTURE_CHAR_MAP['■'];
				charIndexes.push(index);
				continue;
			}

			const char = text[i];
			const index = TEXT_TEXTURE_CHAR_MAP[char] ?? TEXT_TEXTURE_CHAR_MAP['■'];
			charIndexes.push(index);
		}

		for (let i = 0; i < this.facesCount; i++) {
			const charIndex = charIndexes[this.meshFlipped ? i : (this.facesCount - i - 1)];
			const charX = charIndex % TEXT_TEXTURE_CHAR_COLS;
			const charY = Math.floor(charIndex / TEXT_TEXTURE_CHAR_COLS);

			const uvIndex = i * (this.verticesCountPerFace * 2); // uvは(x,y)の2要素なので*2

			if (this.meshFlipped) {
				this.uvs[uvIndex + this.aIndex + 0] = this.uvs[uvIndex + this.cIndex + 0] = this.uvs[uvIndex + this.eIndex + 0] = (charX + 0) / TEXT_TEXTURE_CHAR_COLS;
				this.uvs[uvIndex + this.aIndex + 1] = this.uvs[uvIndex + this.bIndex + 1] = this.uvs[uvIndex + this.dIndex + 1] = (charY + 0) / TEXT_TEXTURE_CHAR_ROWS;
				this.uvs[uvIndex + this.bIndex + 0] = this.uvs[uvIndex + this.dIndex + 0] = this.uvs[uvIndex + this.fIndex + 0] = (charX + 1) / TEXT_TEXTURE_CHAR_COLS;
				this.uvs[uvIndex + this.cIndex + 1] = this.uvs[uvIndex + this.eIndex + 1] = this.uvs[uvIndex + this.fIndex + 1] = (charY + 1) / TEXT_TEXTURE_CHAR_ROWS;
			} else {
				this.uvs[uvIndex + this.aIndex + 0] = this.uvs[uvIndex + this.dIndex + 0] = this.uvs[uvIndex + this.bIndex + 0] = (charX + 0) / TEXT_TEXTURE_CHAR_COLS;
				this.uvs[uvIndex + this.aIndex + 1] = this.uvs[uvIndex + this.dIndex + 1] = this.uvs[uvIndex + this.eIndex + 1] = (charY + 0) / TEXT_TEXTURE_CHAR_ROWS;
				this.uvs[uvIndex + this.eIndex + 0] = this.uvs[uvIndex + this.fIndex + 0] = this.uvs[uvIndex + this.cIndex + 0] = (charX + 1) / TEXT_TEXTURE_CHAR_COLS;
				this.uvs[uvIndex + this.bIndex + 1] = this.uvs[uvIndex + this.cIndex + 1] = this.uvs[uvIndex + this.fIndex + 1] = (charY + 1) / TEXT_TEXTURE_CHAR_ROWS;
			}
		}

		this.mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, this.uvs);
	}

	public async writeWithAnimation(text: string) {
		const prev = this.currentText;
		for (let i = 0; i <= prev.length; i++) {
			this.write(prev.substring(0, prev.length - (i + 1)).padEnd(prev.length, ' '));
			await sleep(20);
		}

		for (let i = 0; i <= text.length; i++) {
			this.write(text.substring(0, i + 1).padEnd(text.length, ' '));
			await sleep(20);
		}
	}
}

export function sleep(ms: number) {
	// workerで実行される可能性がある
	// eslint-disable-next-line no-restricted-globals
	return new Promise(resolve => setTimeout(resolve, ms));
}

export class Timer {
	private timeoutIds: number[] = [];
	private intervalIds: number[] = [];

	public setTimeout(callback: () => void, ms: number) {
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		const id = setTimeout(() => {
			this.timeoutIds = this.timeoutIds.filter(i => i !== id);
			callback();
		}, ms);
		this.timeoutIds.push(id);
	}

	public setInterval(callback: () => void, ms: number) {
		// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
		const id = setInterval(callback, ms);
		this.intervalIds.push(id);
	}

	public dispose() {
		for (const id of this.timeoutIds) {
			// workerで実行される可能性がある
			// eslint-disable-next-line no-restricted-globals
			clearTimeout(id);
		}
		this.timeoutIds = [];

		for (const id of this.intervalIds) {
			// workerで実行される可能性がある
		// eslint-disable-next-line no-restricted-globals
			clearInterval(id);
		}
		this.intervalIds = [];
	}
}

export function getYRotationDirection(rotationY: number): '+x' | '+z' | '-x' | '-z' {
	const angle = rotationY % (2 * Math.PI);
	if ((angle >= 0 && angle < Math.PI / 4) || (angle >= 7 * Math.PI / 4 && angle < 2 * Math.PI)) {
		return '-z';
	} else if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
		return '-x';
	} else if (angle >= 3 * Math.PI / 4 && angle < 5 * Math.PI / 4) {
		return '+z';
	} else {
		return '+x';
	}
}

export function getHex(c: [number, number, number]) {
	return `#${c.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}

export class FreeCameraManualInput implements BABYLON.ICameraInput<BABYLON.FreeCamera> {
	public camera: BABYLON.FreeCamera;
	private scene: BABYLON.Scene;
	private moveSensitivity: number;
	private rotationSensitivity: number;
	private moveVector = BABYLON.Vector3.Zero();

	constructor(scene: BABYLON.Scene, options: {
		moveSensitivity?: number;
		rotationSensitivity?: number;
	}) {
		this.scene = scene;
		this.moveSensitivity = options.moveSensitivity ?? 0.01;
		this.rotationSensitivity = options.rotationSensitivity ?? 0.01;
	}

	getClassName = () => this.constructor.name;

	getSimpleName = () => 'manual';

	attachControl(noPreventDefault) {
	}

	detachControl() {
	}

	public setMoveVector(vec: { x: number; y: number }) {
		this.moveVector = new BABYLON.Vector3(vec.x, 0, -vec.y).scale(this.moveSensitivity);
	}

	public setRotationVector(vec: { x: number; y: number }) {
		let directionAdjust = 1;
		if (this.scene.useRightHandedSystem) directionAdjust *= -1;
		if (this.camera.parent && this.camera.parent._getWorldMatrixDeterminant() < 0) directionAdjust *= -1;

		this.camera.cameraRotation.x += vec.y * this.rotationSensitivity * directionAdjust;
		this.camera.cameraRotation.y += vec.x * this.rotationSensitivity * directionAdjust;
	}

	checkInputs() {
		const ratio = this.scene.getAnimationRatio();
		this.camera.cameraDirection.addInPlace(
			BABYLON.Vector3.TransformCoordinates(this.moveVector.scale(ratio), BABYLON.Matrix.RotationY(this.camera.rotation.y)),
		);

		//const engine = this.camera.getEngine();
		//const v = this.moveVector.scale(Math.sqrt(engine.getDeltaTime() / (engine.getFps() * 100.0)));
		//console.log(v);
		//this.camera._localDirection.copyFromFloats(v.x, v.y, v.z);
		//this.camera.getViewMatrix().invertToRef(this.camera._cameraTransformMatrix);
		//BABYLON.Vector3.TransformNormalToRef(this.camera._localDirection, this.camera._cameraTransformMatrix, this.camera._transformedDirection);
		//this.camera.cameraDirection.addInPlace(this.camera._transformedDirection);
	}
}
