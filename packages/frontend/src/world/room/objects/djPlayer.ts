/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { normalizeUvToSquare } from '../../utility.js';
import { i18n } from '@/i18n.js';

export const djPlayer = defineObject({
	id: 'djPlayer',
	name: i18n.ts._miRoom._objects.djPlayer,
	options: {
		schema: {
			screenBrightness: {
				type: 'range',
				label: i18n.ts._miRoom._objects._djPlayer.screenBrightness,
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				label: i18n.ts._miRoom._objects._djPlayer.image,
				presets: [{
					label: i18n.ts._miRoom._objects._djPlayer['image:waveform'],
					value: 'waveform',
				}],
			},
		},
		default: {
			screenBrightness: 0.5,
			image: { type: 'waveform' },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ model, options, scene }) => {
		const screenMesh = model.findMesh('__X_SCREEN__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

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
				url = '/client-assets/room/objects/dj-player/textures/display-waveform.png';
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
