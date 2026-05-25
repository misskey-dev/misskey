/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const lowPartitionBar = defineObject({
	id: 'lowPartitionBar',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.8, 0.8], roughness: 0.1, metallic: 1 },
			width: 0.5,
		},
	},
	placement: 'top',
	//hasCollisions: true,
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
				const widthTarget = mesh.morphTargetManager?.getTargetByName('W');
				if (widthTarget != null) {
					widthTarget.influence = options.width;
				}
			}
			model.updated();
		};

		applySize();

		return {
			onOptionsUpdated: ([k]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'width': applySize(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
