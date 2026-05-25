/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { i18n } from '@/i18n.js';

export const handheldGameConsole = defineObject({
	id: 'handheldGameConsole',
	name: i18n.ts._miRoom._objects.handheldGameConsole,
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._handheldGameConsole.bodyMat,
			},
			screenBrightness: {
				type: 'range',
				label: i18n.ts._miRoom._objects._handheldGameConsole.screenBrightness,
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				label: i18n.ts._miRoom._objects._handheldGameConsole.image,
				presets: [],
			},
		},
		default: {
			bodyMat: { color: [1, 1, 1], roughness: 0.5, metallic: 0 },
			screenBrightness: 0.5,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const screenMesh = model.findMesh('__X_SCREEN__');

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);

		const textureManager = createTextureManager(screenMesh, () => 20 / 10.4, scene);

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveIntensity = b * 2;
		};

		applyScreenBrightness();

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

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

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
