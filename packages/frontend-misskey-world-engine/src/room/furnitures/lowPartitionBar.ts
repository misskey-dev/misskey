/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../furniture.js';
import { lowPartitionBar_schema } from 'misskey-world/src/room/furnitures/lowPartitionBar.schema.js';

export const lowPartitionBar = defineFuniture(lowPartitionBar_schema, {
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
