/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const speakerStand = defineObject({
	id: 'speakerStand',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.2, 0.2, 0.2], roughness: 0.5, metallic: 0.8 },
			height: 0.1,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const applySize = () => {
			for (const mesh of model.root.getChildMeshes()) {
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('Height') != null) {
					mesh.morphTargetManager.getTargetByName('Height').influence = options.height;
				}
			}
			model.updated();
		};

		applySize();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'height': applySize(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
