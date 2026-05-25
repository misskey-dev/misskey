/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const cactusS = defineObject({
	id: 'cactusS',
	name: i18n.ts._miRoom._objects.cactusS,
	options: {
		schema: {
			potMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._cactusS.potMat,
			},
		},
		default: {
			potMat: { color: [0.45, 0.45, 0.45], roughness: 0.5, metallic: 0 },
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
				applyPotMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
