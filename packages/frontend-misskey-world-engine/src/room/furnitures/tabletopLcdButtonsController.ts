/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { tabletopLcdButtonsController_schema } from 'misskey-world/src/room/furnitures/tabletopLcdButtonsController.schema.js';
import { createTextureManager, defineFurniture } from '../furniture.js';
import { normalizeUvToSquare } from '../../utility.js';

export const tabletopLcdButtonsController = defineFurniture(tabletopLcdButtonsController_schema, {
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
			return textureManager.change(url, options.image.fit, options.image.rotation).then((tex) => {
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
