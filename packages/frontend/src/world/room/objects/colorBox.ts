/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const colorBox = defineObject({
	id: 'colorBox',
	options: {
		schema: {
			mat: {
				type: 'material',
			},
		},
		default: {
			mat: { color: [0.6, 0.35, 0.15], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: false,
	canPreMeshesMerging: true,
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
				applyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
