/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const pachira = defineObject({
	id: 'pachira',
	name: 'Pachira',
	options: {
		schema: {
			potMat: {
				type: 'material',
				label: 'potMaterial',
			},
		},
		default: {
			potMat: { color: [0.8, 0.8, 0.8], roughness: 0.2, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const potMaterial = model.findMaterial('__X_POT__');

		const applyPotMat = () => {
			potMaterial.albedoColor = new BABYLON.Color3(options.potMat.color[0], options.potMat.color[1], options.potMat.color[2]);
			potMaterial.roughness = options.potMat.roughness;
			potMaterial.metallic = options.potMat.metallic;
		};

		applyPotMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'potMat': applyPotMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
