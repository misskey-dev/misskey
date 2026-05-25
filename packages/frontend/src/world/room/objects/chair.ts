/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const chair = defineObject({
	id: 'chair',
	name: 'Chair',
	options: {
		schema: {
			primaryMat: {
				type: 'material',
				label: 'Primay Material',
			},
			secondaryMat: {
				type: 'material',
				label: 'Secondary Material',
			},
		},
		default: {
			primaryMat: { color: [0.44, 0.6, 0], roughness: 1, metallic: 0 },
			secondaryMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	isChair: true,
	canPreMeshesMerging: true,
	createInstance: ({ model, options, sitChair }) => {
		const primaryMaterial = model.findMaterial('__X_PRIMARY__');
		const secondaryMaterial = model.findMaterial('__X_SECONDARY__');

		const applyPrimaryMat = () => {
			primaryMaterial.albedoColor = new BABYLON.Color3(options.primaryMat.color[0], options.primaryMat.color[1], options.primaryMat.color[2]);
			primaryMaterial.roughness = options.primaryMat.roughness;
			primaryMaterial.metallic = options.primaryMat.metallic;
		};

		const applySecondaryMat = () => {
			secondaryMaterial.albedoColor = new BABYLON.Color3(options.secondaryMat.color[0], options.secondaryMat.color[1], options.secondaryMat.color[2]);
			secondaryMaterial.roughness = options.secondaryMat.roughness;
			secondaryMaterial.metallic = options.secondaryMat.metallic;
		};

		applyPrimaryMat();
		applySecondaryMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyPrimaryMat();
				applySecondaryMat();
			},
			interactions: {
				sit: {
					label: 'Sit',
					fn: () => {
						sitChair?.();
					},
				},
			},
			primaryInteraction: 'sit',
			dispose: () => {},
		};
	},
});
