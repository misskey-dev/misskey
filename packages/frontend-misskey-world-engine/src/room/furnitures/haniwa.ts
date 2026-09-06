/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { haniwa_schema } from 'misskey-world/src/room/furnitures/haniwa.schema.js';
import { defineFurniture } from '../furniture.js';

export const haniwa = defineFurniture(haniwa_schema, {
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const insideMaterial = model.findMaterial('__X_INSIDE__');

		insideMaterial.emissiveIntensity = 1;

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const applyInsideColor = () => {
			insideMaterial.emissiveColor = new BABYLON.Color3(options.insideColor[0], options.insideColor[1], options.insideColor[2]);
		};

		applyInsideColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'insideColor': applyInsideColor(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
