/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper } from '../../utility.js';

export const largeMousepad = defineObject({
	id: 'largeMousepad',
	name: 'largeMousepad',
	options: {
		schema: {
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
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const padMesh = model.findMesh('__X_PAD__');
		const padMaterial = model.findMaterial('__X_PAD__');

		const updateUv = createPlaneUvMapper(padMesh);

		const applyFit = () => {
			const tex = padMaterial.albedoTexture;
			if (tex == null) return;

			const srcAspect = tex.getSize().width / tex.getSize().height;
			const targetAspect = 70 / 30;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				padMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false, undefined, () => {
					padMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
					padMaterial.albedoTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					padMaterial.albedoColor = new BABYLON.Color3(0, 1, 0);
					padMaterial.albedoTexture = null;
					resolve();
				});
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
			} else {
				padMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				padMaterial.albedoTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'customPicture': applyCustomPicture(); break;
					case 'fit': applyFit(); break;
				}
			},
			interactions: {},
		};
	},
});
