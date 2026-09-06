/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFurniture } from '../furniture.js';
import { snakeplant_schema } from 'misskey-world/src/room/furnitures/snakeplant.schema.js';

export const snakeplant = defineFurniture(snakeplant_schema, {
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
