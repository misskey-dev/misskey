/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const hangingDuctRail = defineObject({
	id: 'hangingDuctRail',
	name: i18n.ts._miRoom._objects.hangingDuctRail,
	options: {
		schema: {
			width: {
				type: 'range',
				label: i18n.ts._miRoom._objects._hangingDuctRail.width,
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: i18n.ts._miRoom._objects._hangingDuctRail.height,
				min: 0,
				max: 1,
				step: 0.01,
			},
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._hangingDuctRail.bodyMat,
			},
		},
		default: {
			width: 0.2,
			height: 0.2,
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 0.3 },
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

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

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
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
