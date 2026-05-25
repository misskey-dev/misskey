/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const piano = defineObject({
	id: 'piano',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
		},
		default: {
			bodyMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		return {
			onOptionsUpdated: () => {
				applyBodyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
