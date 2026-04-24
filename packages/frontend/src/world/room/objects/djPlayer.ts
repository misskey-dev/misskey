/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { createPlaneUvMapper, normalizeUvToSquare } from '../../utility.js';

export const djPlayer = defineObject({
	id: 'djPlayer',
	name: 'djPlayer',
	options: {
		schema: {
			screenBrightness: {
				type: 'range',
				label: 'Screen brightness',
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
			screenBrightness: 0.35,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ model, options, scene }) => {
		const screenMesh = model.findMesh('__X_SCREEN__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');
		const defaultScreenTexture = screenMaterial.emissiveTexture;

		normalizeUvToSquare(screenMesh);
		const updateUv = createPlaneUvMapper(screenMesh);

		const applyFit = () => {
			const tex = screenMaterial.emissiveTexture;
			if (tex == null) return;

			const srcAspect = tex.getSize().width / tex.getSize().height;
			const targetAspect = 15.6 / 8.33;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			// テクスチャの読み込みに失敗したときの救済
			// TODO: 丁寧な実装に直す
			setTimeout(() => {
				resolve();
			}, 10000);

			if (options.customPicture != null && options.customPicture !== '') {
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false);
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.level = 0.5;

				screenMaterial.unfreeze();
				screenMaterial.emissiveTexture = tex;

				tex.onLoadObservable.addOnce(() => {
					applyFit();
					resolve();
				});
			} else {
				screenMaterial.emissiveTexture = defaultScreenTexture;
				applyFit();
				resolve();
			}
		});

		await applyCustomPicture();

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveColor = new BABYLON.Color3(b, b, b);
		};

		applyScreenBrightness();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'screenBrightness': applyScreenBrightness(); break;
					case 'customPicture': applyCustomPicture(); break;
					case 'fit': applyFit(); break;
				}
			},
			interactions: {},
		};
	},
});
