/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const keyboard = defineObject({
	id: 'keyboard',
	name: 'Keyboard',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			keyColor: {
				type: 'color',
				label: 'key color',
			},
		},
		default: {
			bodyColor: [0.3, 0.3, 0.3],
			keyColor: [0.2, 0.2, 0.2],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const keyMaterial = model.findMaterial('__X_KEY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applyKeyColor = () => {
			const [r, g, b] = options.keyColor;
			keyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyKeyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'keyColor': applyKeyColor(); break;
				}
			},
			interactions: {},
		};
	},
});
