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
			frameMat: {
				type: 'material',
				label: 'Frame material',
			},
		},
		default: {
			frameMat: { color: [0.2, 0.1, 0.02], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: true,
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyFrameMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			bodyMaterial.roughness = options.frameMat.roughness;
			bodyMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameMat': applyFrameMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
