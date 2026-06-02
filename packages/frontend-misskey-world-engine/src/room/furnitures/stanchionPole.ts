/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { defineFuniture } from '../furniture.js';
import { stanchionPole_schema } from 'misskey-world/src/room/furnitures/stanchionPole.schema.js';

export const stanchionPole = defineFuniture(stanchionPole_schema, {
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const ropeMaterial = model.findMaterial('__X_ROPE__');

		const applyRopeMat = () => {
			ropeMaterial.albedoColor = new BABYLON.Color3(options.ropeMat.color[0], options.ropeMat.color[1], options.ropeMat.color[2]);
			ropeMaterial.roughness = options.ropeMat.roughness;
			ropeMaterial.metallic = options.ropeMat.metallic;
		};

		applyRopeMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'ropeMat': applyRopeMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
