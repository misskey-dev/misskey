/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { normalizeUvToSquare } from '../../utility.js';
import { i18n } from '@/i18n.js';

export const tabletopLcdButtonsController = defineObject({
	id: 'tabletopLcdButtonsController',
	name: i18n.ts._miRoom._objects.tabletopLcdButtonsController,
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.bodyMat,
			},
			screenBrightness: {
				type: 'range',
				label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.screenBrightness,
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				label: i18n.ts._miRoom._objects._tabletopLcdButtonsController.image,
				presets: [],
			},
		},
		default: {
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 0.3 },
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
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

		normalizeUvToSquare(screenMesh);

		const textureManager = createTextureManager(screenMesh, () => 9.5 / 5.55, scene);

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

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
					case 'bodyMat': applyBodyMat(); break;
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
