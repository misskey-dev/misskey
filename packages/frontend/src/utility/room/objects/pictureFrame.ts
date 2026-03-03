/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { getPlaneUvIndexes } from '../utility.js';

export const pictureFrame = defineObject({
	id: 'pictureFrame',
	name: 'Simple picture frame',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
			width: {
				type: 'range',
				label: 'Width',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: 'Height',
				min: 0,
				max: 1,
				step: 0.01,
			},
			frameThickness: {
				type: 'range',
				label: 'Frame thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matHThickness: {
				type: 'range',
				label: 'Mat horizontal thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matVThickness: {
				type: 'range',
				label: 'Mat vertical thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			customPicture: {
				type: 'image',
				label: 'Custom picture',
			},
			fit: {
				type: 'enum',
				label: 'Custom picture fit',
				enum: ['cover', 'contain', 'stretch'],
			},
		},
		default: {
			frameColor: [0.71, 0.58, 0.39],
			width: 0.15,
			height: 0.15,
			frameThickness: 0.3,
			matHThickness: 0.5,
			matVThickness: 0.5,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'side',
	createInstance: ({ room, root, options, findMaterial, findMesh, meshUpdated }) => {
		const MAT_THICKNESS_FACTOR = 0.49; // 0.5を超えるとなんかメッシュのレンダリングがグリッチするため

		const frameMesh = findMesh('__X_FRAME__');
		frameMesh.rotationQuaternion = null;
		const matMesh = findMesh('__X_MAT__');
		matMesh.rotationQuaternion = null;
		const coverMesh = findMesh('__X_COVER__');
		coverMesh.rotationQuaternion = null;
		const pictureMesh = findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;
		pictureMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		const pictureMaterial = findMaterial('__X_PICTURE__');

		const uvs = pictureMesh.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
		const uvIndexes = getPlaneUvIndexes(pictureMesh);

		const ax = uvs[uvIndexes[0]];
		const ay = uvs[uvIndexes[0] + 1];
		const bx = uvs[uvIndexes[1]];
		const by = uvs[uvIndexes[1] + 1];
		const cx = uvs[uvIndexes[2]];
		const cy = uvs[uvIndexes[2] + 1];
		const dx = uvs[uvIndexes[3]];
		const dy = uvs[uvIndexes[3] + 1];

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width * (1 - (options.matHThickness * MAT_THICKNESS_FACTOR));
			const targetHeight = options.height * (1 - (options.matVThickness * MAT_THICKNESS_FACTOR));
			const targetAspect = targetWidth / targetHeight;

			let newAx = ax;
			let newAy = ay;
			let newBx = bx;
			let newBy = by;
			let newCx = cx;
			let newCy = cy;
			let newDx = dx;
			let newDy = dy;

			if (options.fit === 'cover') {
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
			} else if (options.fit === 'contain') {
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
			}

			uvs[uvIndexes[0]] = newAx;
			uvs[uvIndexes[0] + 1] = newAy;
			uvs[uvIndexes[1]] = newBx;
			uvs[uvIndexes[1] + 1] = newBy;
			uvs[uvIndexes[2]] = newCx;
			uvs[uvIndexes[2] + 1] = newCy;
			uvs[uvIndexes[3]] = newDx;
			uvs[uvIndexes[3] + 1] = newDy;

			pictureMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
		};

		applyFit();

		const applyFrameThickness = () => {
			frameMesh.morphTargetManager!.getTargetByName('FrameThickness')!.influence = options.frameThickness;
			meshUpdated();
		};

		applyFrameThickness();

		const applyMatThickness = () => {
			matMesh.morphTargetManager!.getTargetByName('MatH')!.influence = options.matHThickness * MAT_THICKNESS_FACTOR * options.width;
			matMesh.morphTargetManager!.getTargetByName('MatV')!.influence = options.matVThickness * MAT_THICKNESS_FACTOR * options.height;
			pictureMesh.morphTargetManager!.getTargetByName('PictureWidth')!.influence = options.width * (1 - (options.matHThickness * MAT_THICKNESS_FACTOR));
			pictureMesh.morphTargetManager!.getTargetByName('PictureHeight')!.influence = options.height * (1 - (options.matVThickness * MAT_THICKNESS_FACTOR));
			meshUpdated();

			applyFit();
		};

		applyMatThickness();

		const applySize = () => {
			frameMesh.morphTargetManager!.getTargetByName('FrameWidth')!.influence = options.width;
			frameMesh.morphTargetManager!.getTargetByName('FrameHeight')!.influence = options.height;
			matMesh.morphTargetManager!.getTargetByName('MatWidth')!.influence = options.width;
			matMesh.morphTargetManager!.getTargetByName('MatHeight')!.influence = options.height;
			coverMesh.morphTargetManager!.getTargetByName('CoverWidth')!.influence = options.width;
			coverMesh.morphTargetManager!.getTargetByName('CoverHeight')!.influence = options.height;
			meshUpdated();

			applyMatThickness();
		};

		applySize();

		const applyCustomPicture = () => {
			if (options.customPicture != null) {
				const tex = new BABYLON.Texture(options.customPicture, room.scene, false, false);
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

				pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
				pictureMaterial.albedoTexture = tex;

				applyFit();

				tex.onLoadObservable.addOnce(() => {
					applyFit();
				});
			} else {
				pictureMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				pictureMaterial.albedoTexture = null;
			}
		};

		applyCustomPicture();

		const frameMaterial = findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				if (k === 'frameColor') {
					applyFrameColor();
				}
				if (k === 'direction') {
					applyDirection();
				}
				if (k === 'width' || k === 'height') {
					applySize();
				}
				if (k === 'frameThickness') {
					applyFrameThickness();
				}
				if (k === 'matHThickness' || k === 'matVThickness') {
					applyMatThickness();
				}
				if (k === 'customPicture') {
					applyCustomPicture();
				}
				if (k === 'fit') {
					applyFit();
				}
			},
			interactions: {},
		};
	},
});

/*

const applyDirection = () => {
	if (options.direction === 'vertical') {
		frameMesh.rotation.z = 0;
		matMesh.rotation.z = 0;
		coverMesh.rotation.z = 0;
		pictureMesh.rotation.z = 0;

		uvs[6] = ax;
		uvs[7] = ay;
		uvs[2] = bx;
		uvs[3] = by;
		uvs[4] = cx;
		uvs[5] = cy;
		uvs[0] = dx;
		uvs[1] = dy;
	} else if (options.direction === 'horizontal') {
		frameMesh.rotation.z = -Math.PI / 2;
		matMesh.rotation.z = -Math.PI / 2;
		coverMesh.rotation.z = -Math.PI / 2;
		pictureMesh.rotation.z = -Math.PI / 2;

		uvs[6] = cy;
		uvs[7] = cx;
		uvs[2] = dy;
		uvs[3] = dx;
		uvs[4] = ay;
		uvs[5] = ax;
		uvs[0] = by;
		uvs[1] = bx;
	}

	pictureMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
};

*/
