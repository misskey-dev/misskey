/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const boxWallShelf = defineObject({
	id: 'boxWallShelf',
	name: 'boxWallShelf',
	options: {
		schema: {
			width: {
				type: 'range',
				label: 'Width',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: 'Height',
				min: 0,
				max: 1,
				step: 0.01,
			},
			bodyMat: {
				type: 'material',
				label: 'Body material',
			},
			withBack: {
				type: 'boolean',
				label: 'With back',
			},
		},
		default: {
			width: 0.1,
			height: 0.1,
			bodyMat: { color: [0.6, 0.35, 0.15], roughness: 0.5, metallic: 0 },
			withBack: true,
		},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: false,
	createInstance: async ({ scene, options, model }) => {
		const backMesh = model.findMesh('__X_BACK__');
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applySize = () => {
			for (const mesh of model.root.getChildMeshes()) {
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('W') != null) {
					mesh.morphTargetManager.getTargetByName('W').influence = options.width;
				}
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('H') != null) {
					mesh.morphTargetManager.getTargetByName('H').influence = options.height;
				}
			}
			model.updated();
		};

		applySize();

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const applyWithBack = () => {
			backMesh.isVisible = options.withBack;
			model.updated();
		};

		applyWithBack();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
						applySize();
						break;
					case 'bodyMat':
						applyBodyMat();
						break;
					case 'withBack':
						applyWithBack();
						break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
