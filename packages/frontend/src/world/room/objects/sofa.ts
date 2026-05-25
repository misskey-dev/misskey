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
			bodyMat: {
				type: 'material',
				label: 'bodyMaterial',
			},
		},
		default: {
			bodyMat: { color: [0.4, 0.4, 0.4], roughness: -1, metallic: -1 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	canPreMeshesMerging: true,
	hasTexture: false,
	createInstance: ({ options, model, id }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		console.log(id, bodyMaterial.roughness, bodyMaterial.metallic);

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
