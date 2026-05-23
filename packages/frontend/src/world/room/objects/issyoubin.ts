/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const issyoubin = defineObject({
	id: 'issyoubin',
	name: 'issyoubin',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: [{
					label: 'Misuki',
					value: 'misuki',
				}, {
					label: 'AI',
					value: 'ai',
				}],
			},
		},
		default: {
			variation: 'misuki',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
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
				const tex = new BABYLON.Texture('/client-assets/room/objects/issyoubin/textures/misuki.png', scene, false, false);
				labelMaterial.albedoTexture = tex;
				bottleMaterial.albedoColor = new BABYLON.Color3(0.33, 0.06, 0);
				bottleMaterial.alpha = 0.8;
			} else if (options.variation === 'ai') {
				const tex = new BABYLON.Texture('/client-assets/room/objects/issyoubin/textures/ai.png', scene, false, false);
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
