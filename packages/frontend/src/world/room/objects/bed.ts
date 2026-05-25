/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const bed = defineObject({
	id: 'bed',
	name: 'Bed',
	options: {
		schema: {
			mat: {
				type: 'material',
				label: 'Material',
			},
		},
		default: {
			mat: { color: [0.2, 0.1, 0.02], roughness: -1, metallic: -1 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: true,
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;
		console.log('bed', bodyMaterial.roughness, bodyMaterial.metallic);

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
