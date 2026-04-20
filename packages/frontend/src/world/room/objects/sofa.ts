/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const sofa = defineObject({
	id: 'sofa',
	name: 'Sofa',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'bodyColor',
			},
		},
		default: {
			bodyColor: [0.4, 0.4, 0.4],
		},
	},
	placement: 'floor',
	hasCollisions: true,
	canPreMeshesMerging: true,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyColor();
			},
			interactions: {},
		};
	},
});
