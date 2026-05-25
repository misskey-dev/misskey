/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const wireNet = defineObject({
	id: 'wireNet',
	name: 'wireNet',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: 'bodyMaterial',
			},
		},
		default: {
			bodyMat: { color: [0.03, 0.03, 0.03], roughness: 0.5, metallic: 0.5 },
		},
	},
	placement: 'side',
	hasCollisions: false,
	canPreMeshesMerging: true,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
