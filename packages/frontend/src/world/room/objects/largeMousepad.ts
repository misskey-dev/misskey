/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const largeMousepad = defineObject({
	id: 'largeMousepad',
	name: i18n.ts._miRoom._objects.largeMousepad,
	options: {
		schema: {
			image: {
				type: 'image',
				label: i18n.ts._miRoom._objects._largeMousepad.image,
				presets: [],
			},
		},
		default: {
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const padMesh = model.findMesh('__X_PAD__');
		const padMaterial = model.findMaterial('__X_PAD__');
		padMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(padMesh, () => 70 / 30, scene);

		const applyImage = () => {
			padMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				padMaterial.albedoTexture = tex;
			});
		};

		await applyImage();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
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
