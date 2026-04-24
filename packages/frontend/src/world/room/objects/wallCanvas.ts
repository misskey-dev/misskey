/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { createPlaneUvMapper, getPlaneUvIndexes } from '../../utility.js';

export const wallCanvas = defineObject({
	id: 'wallCanvas',
	name: 'wallCanvas',
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
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const canvasMesh = model.findMesh('__X_CANVAS__');
		canvasMesh.rotationQuaternion = null;

		const canvasMaterial = model.findMaterial('__X_CANVAS__');

		const updateUv = createPlaneUvMapper(canvasMesh);

		const applyFit = () => {
			const tex = canvasMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width;
			const targetHeight = options.height;
			const targetAspect = targetWidth / targetHeight;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applySize = () => {
			canvasMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			canvasMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			model.updated();

			applyFit();
		};

		applySize();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				canvasMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false, undefined, () => {
					canvasMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
					canvasMaterial.albedoTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					canvasMaterial.albedoColor = new BABYLON.Color3(0, 1, 0);
					canvasMaterial.albedoTexture = null;
					resolve();
				});
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
			} else {
				canvasMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				canvasMaterial.albedoTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
						applySize();
						break;
					case 'customPicture':
					case 'fit':
						applyCustomPicture();
						break;
				}
			},
			interactions: {},
		};
	},
});
