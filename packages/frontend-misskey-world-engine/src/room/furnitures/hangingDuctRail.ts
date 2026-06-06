/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFuniture } from '../furniture.js';
import { hangingDuctRail_schema } from 'misskey-world/src/room/furnitures/hangingDuctRail.schema.js';

export const hangingDuctRail = defineFuniture(hangingDuctRail_schema, {
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
