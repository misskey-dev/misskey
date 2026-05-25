/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const speaker = defineObject({
	id: 'speaker',
	name: 'Speaker',
	options: {
		schema: {
			outerMat: {
				type: 'material',
				label: 'Outer Material',
			},
			innerMat: {
				type: 'material',
				label: 'Inner Material',
			},
		},
		default: {
			outerMat: { color: [0.45, 0.8, 0], roughness: 0.1, metallic: 0 },
			innerMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0.5 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const outerMaterial = model.findMaterial('__X_COVER__');
		const innerMaterial = model.findMaterial('__X_BODY__');

		const applyOuterMat = () => {
			outerMaterial.albedoColor = new BABYLON.Color3(options.outerMat.color[0], options.outerMat.color[1], options.outerMat.color[2]);
			outerMaterial.roughness = options.outerMat.roughness;
			outerMaterial.metallic = options.outerMat.metallic;
		};

		const applyInnerMat = () => {
			innerMaterial.albedoColor = new BABYLON.Color3(options.innerMat.color[0], options.innerMat.color[1], options.innerMat.color[2]);
			innerMaterial.roughness = options.innerMat.roughness;
			innerMaterial.metallic = options.innerMat.metallic;
		};

		applyOuterMat();
		applyInnerMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyOuterMat();
				applyInnerMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
