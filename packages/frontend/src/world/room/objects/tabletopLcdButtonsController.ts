/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { createPlaneUvMapper, normalizeUvToSquare } from '../../utility.js';

export const tabletopLcdButtonsController = defineObject({
	id: 'tabletopLcdButtonsController',
	name: 'tabletopLcdButtonsController',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
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
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			screenBrightness: 0.5,
			customPicture: null,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ model, options, scene }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const screenMesh = model.findMesh('__X_SCREEN__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');
		const defaultScreenTexture = screenMaterial.emissiveTexture;

		normalizeUvToSquare(screenMesh);
		const updateUv = createPlaneUvMapper(screenMesh);

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applyFit = () => {
			const tex = screenMaterial.emissiveTexture;
			if (tex == null) return;

			const srcAspect = tex.getSize().width / tex.getSize().height;
			const targetAspect = 9.5 / 5.55;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				screenMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture.url, scene, false, false, undefined, () => {
					screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
					screenMaterial.emissiveTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					screenMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
					screenMaterial.emissiveTexture = null;
					resolve();
				});
				tex.level = 0.75;
			} else {
				screenMaterial.emissiveTexture = defaultScreenTexture;
				defaultScreenTexture.level = 0.75;
				applyFit();
				resolve();
			}
		});

		await applyCustomPicture();

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveIntensity = b * 2;
		};

		applyScreenBrightness();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'screenBrightness': applyScreenBrightness(); break;
					case 'customPicture': applyCustomPicture(); break;
				}
			},
			interactions: {},
		};
	},
});
