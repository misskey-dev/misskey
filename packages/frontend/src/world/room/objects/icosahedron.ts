/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const icosahedron = defineObject({
	id: 'icosahedron',
	name: i18n.ts._miRoom._objects.icosahedron,
	options: {
		schema: {
			mat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._icosahedron.mat,
			},
		},
		default: {
			mat: { color: [0.32, 0.12, 0.05], metallic: 1, roughness: 0.5 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			bodyMaterial.roughness = options.mat.roughness;
			bodyMaterial.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'mat': applyMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
