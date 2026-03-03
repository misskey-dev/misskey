/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const poster = defineObject({
	id: 'poster',
	name: 'Poster',
	options: {
		schema: {
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
			width: 0.15,
			height: 0.15,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'side',
	createInstance: ({ room, root, options, findMaterial, findMesh, findMeshes, meshUpdated }) => {
		const pictureMesh = findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;
		pictureMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		const pictureMaterial = findMaterial('__X_PICTURE__');

		const pinMeshes = findMeshes('__X_PIN__');

		const uvs = pictureMesh.getVerticesData(BABYLON.VertexBuffer.UVKind);

		/**
		 *     0         1
		 * 0 a(x,y) --- b(x,y)
		 *     |         |
		 * 1 c(x,y) --- d(x,y)
		 */
		const ax = uvs[4];
		const ay = uvs[5];
		const bx = uvs[6];
		const by = uvs[7];
		const cx = uvs[0];
		const cy = uvs[1];
		const dx = uvs[2];
		const dy = uvs[3];

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width;
			const targetHeight = options.height;
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

			uvs[4] = newAx;
			uvs[5] = newAy;
			uvs[6] = newBx;
			uvs[7] = newBy;
			uvs[0] = newCx;
			uvs[1] = newCy;
			uvs[2] = newDx;
			uvs[3] = newDy;

			pictureMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
		};

		applyFit();

		const applySize = () => {
			pictureMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			pictureMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			for (const pinMesh of pinMeshes) {
				pinMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
				pinMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			}
			meshUpdated();

			applyFit();
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

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				if (k === 'width' || k === 'height') {
					applySize();
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
