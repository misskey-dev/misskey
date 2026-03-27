/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const woodRingFloorLamp = defineObject({
	id: 'woodRingFloorLamp',
	name: 'Wood Ring Floor Lamp',
	options: {
		schema: {
			shadeColor: {
				type: 'color',
				label: 'Shade color',
			},
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
		},
		default: {
			shadeColor: [0.21, 0.04, 0],
			bodyColor: [0.05, 0.05, 0.05],
		},
	},
	placement: 'floor',
	createInstance: ({ options, findMaterial }) => {
		const shadeMaterial = findMaterial('__X_SHADE__');

		const applyShadeColor = () => {
			const [r, g, b] = options.shadeColor;
			shadeMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyShadeColor();

		const bodyMaterial = findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyShadeColor();
				applyBodyColor();
			},
			interactions: {},
		};
	},
});
