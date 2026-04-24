/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { createPlaneUvMapper } from '../../utility.js';

export const tabletopFlag = defineObject({
	id: 'tabletopFlag',
	name: 'Tabletop flag',
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
	createInstance: async ({ model, options, scene }) => {
		const flagMesh = model.findMesh('__X_FLAG__');
		const flagMaterial = model.findMaterial('__X_FLAG__');

		const updateUv = createPlaneUvMapper(flagMesh);

		const applyFit = () => {
			const tex = flagMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;

			updateUv(srcAspect, 24 / 16, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			// テクスチャの読み込みに失敗したときの救済
			// TODO: 丁寧な実装に直す
			setTimeout(() => {
				resolve();
			}, 10000);

			if (options.customPicture != null) {
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false);
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

				flagMaterial.unfreeze();
				flagMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
				flagMaterial.albedoTexture = tex;

				tex.onLoadObservable.addOnce(() => {
					applyFit();
					resolve();
				});
			} else {
				flagMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				flagMaterial.albedoTexture = null;
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
