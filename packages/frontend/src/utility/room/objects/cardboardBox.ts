/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const cardboardBox = defineObject({
	id: 'cardboardBox',
	name: 'Cardboard Box',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: ['default', 'mikan', 'aizon'],
			},
		},
		default: {
			variation: 'default',
		},
	},
	placement: 'top',
	hasCollisions: true,
	createInstance: ({ scene, options, model }) => {
		return {
			onInited: () => {
				const material = model.findMaterial('__X_BODY__');
				if (options.variation === 'mikan') {
					const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/mikan.png', scene, false, false);
					material.albedoTexture = tex;
					material.albedoColor = new BABYLON.Color3(1, 1, 1);
				} else if (options.variation === 'aizon') {
					const tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/aizon.png', scene, false, false);
					material.albedoTexture = tex;
					material.albedoColor = new BABYLON.Color3(1, 1, 1);
				}
			},
			interactions: {},
		};
	},
});
