/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../furniture.js';
import { wireBasket_schema } from 'misskey-world/src/room/furnitures/wireBasket.schema.js';

export const wireBasket = defineFuniture(wireBasket_schema, {
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
