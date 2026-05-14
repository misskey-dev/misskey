/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { createPlaneUvMapper, getPlaneUvIndexes, remap } from '../../utility.js';

export const clippedPicture = defineObject({
	id: 'clippedPicture',
	name: 'clippedPicture',
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
			width: 0.1,
			height: 0.1,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const pictureMesh = model.findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;

		const pictureMaterial = model.findMaterial('__X_PICTURE__');

		const updateUv = createPlaneUvMapper(pictureMesh);

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = remap(options.width, 0, 1, 2, 100); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは100cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			const targetHeight = remap(options.height, 0, 1, 2, 100); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは100cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			const targetAspect = targetWidth / targetHeight;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applySize = () => {
			for (const mesh of model.root.getChildMeshes()) {
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('Width') != null) {
					mesh.morphTargetManager.getTargetByName('Width').influence = options.width;
				}
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('Height') != null) {
					mesh.morphTargetManager.getTargetByName('Height').influence = options.height;
				}
			}
			model.updated();
			applyFit();
		};

		applySize();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				pictureMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture.url, scene, false, false, undefined, () => {
					pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
					pictureMaterial.albedoTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					pictureMaterial.albedoColor = new BABYLON.Color3(0, 1, 0);
					pictureMaterial.albedoTexture = null;
					resolve();
				});
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
			} else {
				pictureMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				pictureMaterial.albedoTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width': applySize(); break;
					case 'height': applySize(); break;
					case 'customPicture': applyCustomPicture(); break;
					case 'fit': applyFit(); break;
				}
			},
			interactions: {},
		};
	},
});
