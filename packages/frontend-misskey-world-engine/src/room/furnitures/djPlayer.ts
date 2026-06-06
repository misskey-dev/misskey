/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { djPlayer_schema } from 'misskey-world/src/room/furnitures/djPlayer.schema.js';
import { createTextureManager, defineFuniture } from '../furniture.js';
import { normalizeUvToSquare } from '../../utility.js';

export const djPlayer = defineFuniture(djPlayer_schema, {
	createInstance: async ({ model, options, scene }) => {
		const screenMesh = model.findMesh('__X_SCREEN__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
		screenMaterial.roughness = 0;
		screenMaterial.metallic = 0;

		normalizeUvToSquare(screenMesh);

		const textureManager = createTextureManager(screenMesh, () => 15.6 / 8.33, scene);

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
			} else if (options.image.type === 'waveform') {
				url = '/client-assets/world/objects/dj-player/textures/display-waveform.png';
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				screenMaterial.emissiveTexture = tex;
			});
		};

		await applyImage();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
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
