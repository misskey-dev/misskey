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
				enum: ['misuki', 'ai'],
			},
		},
		default: {
			variation: 'ai',
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: ({ model, options, scene }) => {
		const liquidMesh = model.findMesh('__X_LIQUID__');
		const liquidMaterial = model.findMaterial('__X_LIQUID__');
		const bottleMaterial = model.findMaterial('__X_BOTTLE__');

		// 以下を行うとレンダリングのグリッチが直るが、残念ながらWebGPUかつNCMでは動作しない
		// https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode/#dodont-in-non-compatibility-mode-ncm
		//for (const m of model.root.getChildMeshes()) {
		//	if (m.material != null) {
		//		(m.material as BABYLON.PBRMaterial).separateCullingPass = true;
		//	}
		//}

		// しょうがないので不透明にする
		bottleMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;

		const applyVariation = () => {
			if (options.variation === 'misuki') {
				const tex = new BABYLON.Texture('/client-assets/room/objects/issyoubin/textures/misuki.png', scene, false, false);
				bottleMaterial.albedoTexture = tex;
			} else if (options.variation === 'ai') {
				const tex = new BABYLON.Texture('/client-assets/room/objects/issyoubin/textures/ai.png', scene, false, false);
				bottleMaterial.albedoTexture = tex;
			}
		};

		applyVariation();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'variation':
						applyVariation();
						break;
				}
			},
			interactions: {},
		};
	},
});
