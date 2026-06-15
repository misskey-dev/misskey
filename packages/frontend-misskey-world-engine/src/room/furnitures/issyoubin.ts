/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFurniture } from '../furniture.js';
import { issyoubin_schema } from 'misskey-world/src/room/furnitures/issyoubin.schema.js';

export const issyoubin = defineFurniture(issyoubin_schema, {
	createInstance: ({ model, options, scene }) => {
		const liquidMesh = model.findMesh('__X_LIQUID__');
		const liquidMaterial = model.findMaterial('__X_LIQUID__');
		const bottleMaterial = model.findMaterial('__X_BOTTLE__');
		const labelMaterial = model.findMaterial('__X_LABEL__');

		labelMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
		labelMaterial.alphaCutOff = 0.5;

		bottleMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND;

		const applyVariation = () => {
			if (options.variation === 'misuki') {
				const tex = new BABYLON.Texture('/client-assets/world/objects/issyoubin/textures/misuki.png', scene, false, false);
				labelMaterial.albedoTexture = tex;
				bottleMaterial.albedoColor = new BABYLON.Color3(0.33, 0.06, 0);
				bottleMaterial.alpha = 0.8;
			} else if (options.variation === 'ai') {
				const tex = new BABYLON.Texture('/client-assets/world/objects/issyoubin/textures/ai.png', scene, false, false);
				labelMaterial.albedoTexture = tex;
				bottleMaterial.albedoColor = new BABYLON.Color3(0.0, 0.5, 0.14);
				bottleMaterial.alpha = 0.8;
			}
		};

		applyVariation();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'variation': applyVariation(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
