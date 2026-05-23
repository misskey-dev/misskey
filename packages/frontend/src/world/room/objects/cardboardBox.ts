/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const cardboardBox = defineObject({
	id: 'cardboardBox',
	name: 'Cardboard Box',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: [{
					label: 'Default',
					value: 'default',
				}, {
					label: 'Mikan',
					value: 'mikan',
				}, {
					label: 'Aizon',
					value: 'aizon',
				}],
			},
		},
		default: {
			variation: 'default',
		},
	},
	placement: 'top',
	hasCollisions: true,
	hasTexture: true,
	createInstance: ({ scene, options, model }) => {
		const material = model.findMaterial('__X_BODY__');
		let tex: BABYLON.Texture | null = null;

		const applyVariation = () => {
			if (options.variation === 'mikan') {
				tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/mikan.png', scene, false, false);
			} else if (options.variation === 'aizon') {
				tex = new BABYLON.Texture('/client-assets/room/objects/cardboard-box/textures/aizon.png', scene, false, false);
			}

			if (tex) {
				material.albedoTexture = tex;
			} else {
				material.albedoTexture = null;
			}
		};

		applyVariation();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'variation':
						applyVariation();
						break;
				}
			},
			interactions: {},
			dispose: () => {
				if (tex) {
					tex.dispose();
				}
			},
		};
	},
});
