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
				if (targetAspect > srcAspect) {
					const fitHeight = targetWidth / srcAspect;
					const crop = (fitHeight - targetHeight) / fitHeight / 2;
					newAy = ay + crop * (by - ay);
					newBy = by - crop * (by - ay);
					newCy = cy + crop * (dy - cy);
					newDy = dy - crop * (dy - cy);
				} else {
					const fitWidth = targetHeight * srcAspect;
					const crop = (fitWidth - targetWidth) / fitWidth / 2;
					newAx = ax + crop * (bx - ax);
					newBx = bx - crop * (bx - ax);
					newCx = cx + crop * (dx - cx);
					newDx = dx - crop * (dx - cx);
				}
			} else if (options.fit === 'contain') {
				if (targetAspect > srcAspect) {
					const fitWidth = targetHeight * srcAspect;
					const crop = (fitWidth - targetWidth) / fitWidth / 2;
					newAx = ax + crop * (bx - ax);
					newBx = bx - crop * (bx - ax);
					newCx = cx + crop * (dx - cx);
					newDx = dx - crop * (dx - cx);
				} else {
					const fitHeight = targetWidth / srcAspect;
					const crop = (fitHeight - targetHeight) / fitHeight / 2;
					newAy = ay + crop * (by - ay);
					newBy = by - crop * (by - ay);
					newCy = cy + crop * (dy - cy);
					newDy = dy - crop * (dy - cy);
				}
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
