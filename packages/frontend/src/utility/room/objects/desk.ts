/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const desk = defineObject({
	id: 'desk',
	name: 'Desk',
	options: {
		schema: {
			topColor: {
				type: 'color',
				label: 'Top color',
			},
		},
		default: {
			topColor: [0, 0, 0],
		},
	},
	placement: 'floor',
	createInstance: ({ options, model }) => {
		const topMaterial = model.findMaterial('__X_BODY__');

		const applyTopColor = () => {
			const [r, g, b] = options.topColor;
			topMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyTopColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyTopColor();
			},
			interactions: {},
		};
	},
});
