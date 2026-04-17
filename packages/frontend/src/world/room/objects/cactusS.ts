/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const cactusS = defineObject({
	id: 'cactusS',
	name: 'Cactus S',
	options: {
		schema: {
			potColor: {
				type: 'color',
				label: 'Pot color',
			},
		},
		default: {
			potColor: [0.45, 0.45, 0.45],
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
				applyPotColor();
			},
			interactions: {},
		};
	},
});
