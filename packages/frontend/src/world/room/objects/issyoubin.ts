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
		},
		default: {
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: ({ model, options, scene }) => {
		// 以下を行うとレンダリングのグリッチが直るが、残念ながらWebGPUかつNCMでは動作しない
		// https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUNonCompatibilityMode/#dodont-in-non-compatibility-mode-ncm
		//for (const m of model.root.getChildMeshes()) {
		//	if (m.material != null) {
		//		(m.material as BABYLON.PBRMaterial).separateCullingPass = true;
		//	}
		//}
		return {
			onOptionsUpdated: ([k, v]) => {
			},
			interactions: {},
		};
	},
});
