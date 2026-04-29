/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const monstera = defineObject({
	id: 'monstera',
	name: 'Monstera',
	options: {
		schema: {
			potColor: {
				type: 'color',
				label: 'potColor',
			},
		},
		default: {
			potColor: [0.5, 0.5, 0.5],
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const potMaterial = model.findMaterial('__X_POT__');

		const applyPotColor = () => {
			const [r, g, b] = options.potColor;
			potMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyPotColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'potColor': applyPotColor(); break;
				}
			},
			interactions: {},
		};
	},
});
