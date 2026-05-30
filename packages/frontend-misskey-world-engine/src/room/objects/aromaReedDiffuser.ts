/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { aromaReedDiffuser_schema } from 'misskey-world/src/room/objects/aromaReedDiffuser.schema.js';
import { defineFuniture } from '../object.js';

export const aromaReedDiffuser = defineFuniture(aromaReedDiffuser_schema, {
	createInstance: ({ options, model }) => {
		const bottleMaterial = model.findMaterial('__X_BOTTLE__');
		const oilMaterial = model.findMaterial('__X_OIL__');

		const applyBottleMat = () => {
			bottleMaterial.albedoColor = new BABYLON.Color3(options.bottleMat.color[0], options.bottleMat.color[1], options.bottleMat.color[2]);
			bottleMaterial.roughness = options.bottleMat.roughness;
			bottleMaterial.metallic = options.bottleMat.metallic;
		};

		const applyOilMat = () => {
			oilMaterial.albedoColor = new BABYLON.Color3(options.oilMat.color[0], options.oilMat.color[1], options.oilMat.color[2]);
			oilMaterial.roughness = options.oilMat.roughness;
			oilMaterial.metallic = options.oilMat.metallic;
		};

		applyBottleMat();
		applyOilMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBottleMat();
				applyOilMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
