/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
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
			image: {
				type: 'image',
				label: 'Image',
				presets: [],
			},
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			screenBrightness: 0.5,
			image: { type: null },
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

		const textureManager = createTextureManager(screenMesh, () => 9.5 / 5.55, scene);

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applyImage = () => {
			screenMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				screenMaterial.emissiveTexture = tex;
			});
		};

		await applyImage();

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
					case 'image': applyImage(); break;
				}
			},
			interactions: {},
			dispose: () => {
				textureManager.dispose();
			},
		};
	},
});
