/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFurniture } from '../furniture.js';
import { speakerStand_schema } from 'misskey-world/src/room/furnitures/speakerStand.schema.js';

export const speakerStand = defineFurniture(speakerStand_schema, {
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
