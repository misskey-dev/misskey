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
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			withBack: {
				type: 'boolean',
				label: 'With back',
			},
		},
		default: {
			width: 0.1,
			height: 0.1,
			bodyColor: [0.6, 0.35, 0.15],
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

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

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
					case 'bodyColor':
						applyBodyColor();
						break;
					case 'withBack':
						applyWithBack();
						break;
				}
			},
			interactions: {},
		};
	},
});
