/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm } from 'misskey-world/src/utility.js';
import { mug_schema } from 'misskey-world/src/room/furnitures/mug.schema.js';
import { defineFurniture } from '../furniture.js';
import { yuge } from '../utility.js';

export const mug = defineFurniture(mug_schema, {
	createInstance: ({ options, scene, root, sr, model }) => {
		const yugeDispose = yuge(scene, root, new BABYLON.Vector3(0, cm(5), 0), sr);

		const bodyMaterial = model.findMaterial('__X_MUG__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const liquidMaterial = model.findMaterial('__X_LIQUID__');

		const applyLiquidMat = () => {
			liquidMaterial.albedoColor = new BABYLON.Color3(options.liquidMat.color[0], options.liquidMat.color[1], options.liquidMat.color[2]);
			liquidMaterial.roughness = options.liquidMat.roughness;
			liquidMaterial.metallic = options.liquidMat.metallic;
		};

		applyLiquidMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'liquidMat': applyLiquidMat(); break;
				}
			},
			interactions: {},
			dispose: () => {
				yugeDispose?.();
			},
		};
	},
});
