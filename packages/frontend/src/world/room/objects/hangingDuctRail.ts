/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const hangingDuctRail = defineObject({
	id: 'hangingDuctRail',
	name: 'hangingDuctRail',
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
				label: 'body color',
			},
		},
		default: {
			width: 0.2,
			height: 0.2,
			bodyColor: [0.05, 0.05, 0.05],
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
	createInstance: async ({ options, model }) => {
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
			bodyMaterial.albedoColor = new BABYLON.Color3(...options.bodyColor);
		};

		applyBodyColor();

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
				}
			},
			interactions: {},
		};
	},
});
