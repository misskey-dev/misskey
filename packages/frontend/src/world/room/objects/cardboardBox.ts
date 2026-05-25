/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const cardboardBox = defineObject({
	id: 'cardboardBox',
	name: i18n.ts._miRoom._objects.cardboardBox,
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: i18n.ts._miRoom._objects._cardboardBox.variation,
				enum: [{
					label: i18n.ts._miRoom._objects._cardboardBox.variation_default,
					value: 'default',
				}, {
					label: i18n.ts._miRoom._objects._cardboardBox.variation_mikan,
					value: 'mikan',
				}, {
					label: i18n.ts._miRoom._objects._cardboardBox.variation_aizon,
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

			if (tex != null) {
				material.albedoTexture = tex;
				material.albedoColor = new BABYLON.Color3(1, 1, 1);
			} else {
				material.albedoTexture = null;
				material.albedoColor = new BABYLON.Color3(0.6, 0.485, 0.31);
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
