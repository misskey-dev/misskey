/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { createPlaneUvMapper } from '../../utility.js';
import { i18n } from '@/i18n.js';

export const tabletopFlag = defineObject({
	id: 'tabletopFlag',
	name: i18n.ts._miRoom._objects.tabletopFlag,
	options: {
		schema: {
			image: {
				type: 'image',
				label: i18n.ts._miRoom._objects._tabletopFlag.image,
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
	createInstance: async ({ model, options, scene }) => {
		const flagMesh = model.findMesh('__X_FLAG__');
		const flagMaterial = model.findMaterial('__X_FLAG__');

		const textureManager = createTextureManager(flagMesh, () => 24 / 16, scene);

		const applyImage = () => {
			flagMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				flagMaterial.albedoTexture = tex;
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
