/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const colorBox = defineObject({
	id: 'colorBox',
	name: 'Color Box',
	options: {
		schema: {
			color: {
				type: 'color',
				label: 'Color',
			},
		},
		default: {
			color: [0.6, 0.35, 0.15],
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyColor = () => {
			const [r, g, b] = options.color;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyColor();
			},
			interactions: {},
		};
	},
});
