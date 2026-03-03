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
		 * a(x,y)---b(x,y)
		 *   |        |
		 * c(x,y)---d(x,y)
		 */
		const ax = uvs[6];
		const ay = uvs[7];
		const bx = uvs[2];
		const by = uvs[3];
		const cx = uvs[4];
		const cy = uvs[5];
		const dx = uvs[0];
		const dy = uvs[1];

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width;
			const targetHeight = options.height;
			const targetAspect = targetWidth / targetHeight;

			const newAx = ax;
			const newAy = ay;
			const newBx = bx;
			const newBy = by;
			const newCx = cx;
			const newCy = cy;
			const newDx = dx;
			const newDy = dy;

			if (options.fit === 'cover') {
				// TODO
			} else if (options.fit === 'contain') {
				// TODO
			}

			uvs[6] = newAx;
			uvs[7] = newAy;
			uvs[2] = newBx;
			uvs[3] = newBy;
			uvs[4] = newCx;
			uvs[5] = newCy;
			uvs[0] = newDx;
			uvs[1] = newDy;

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
