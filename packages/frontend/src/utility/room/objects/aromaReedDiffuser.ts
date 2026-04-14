/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const aromaReedDiffuser = defineObject({
	id: 'aromaReedDiffuser',
	name: 'Aroma Reed Diffuser',
	options: {
		schema: {
			bottleColor: {
				type: 'color',
				label: 'Bottle Color',
			},
			oilColor: {
				type: 'color',
				label: 'Oil Color',
			},
		},
		default: {
			bottleColor: [1, 0.83, 0.48],
			oilColor: [1, 0.4, 0],
		},
	},
	placement: 'top',
	noCollisions: true,
	createInstance: ({ options, model }) => {
		const bottleMesh = model.findMesh('__X_BOTTLE__');
		const bottleMaterial = bottleMesh.material as BABYLON.PBRMaterial;

		const oilMesh = model.findMesh('__X_OIL__');
		const oilMaterial = oilMesh.material as BABYLON.PBRMaterial;

		const applyBottleColor = () => {
			const [r, g, b] = options.bottleColor;
			bottleMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		const applyOilColor = () => {
			const [r, g, b] = options.oilColor;
			oilMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBottleColor();
		applyOilColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBottleColor();
				applyOilColor();
			},
			interactions: {},
		};
	},
});
