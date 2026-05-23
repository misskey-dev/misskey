/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const stanchionPole = defineObject({
	id: 'stanchionPole',
	name: 'stanchionPole',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			ropeColor: {
				type: 'color',
				label: 'Rope color',
			},
		},
		default: {
			bodyColor: [0.8, 0.39, 0.1],
			ropeColor: [0.21, 0.0, 0.0],
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const ropeMaterial = model.findMaterial('__X_ROPE__');

		const applyRopeColor = () => {
			const [r, g, b] = options.ropeColor;
			ropeMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyRopeColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'ropeColor': applyRopeColor(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
