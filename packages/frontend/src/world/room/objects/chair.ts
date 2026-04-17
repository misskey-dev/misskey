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
			primaryColor: {
				type: 'color',
				label: 'Primay Color',
			},
			secondaryColor: {
				type: 'color',
				label: 'Secondary Color',
			},
		},
		default: {
			primaryColor: [0.44, 0.6, 0],
			secondaryColor: [0, 0, 0],
		},
	},
	placement: 'floor',
	hasCollisions: true,
	isChair: true,
	canPreMeshesMerging: true,
	createInstance: ({ model, options }) => {
		const primaryMaterial = model.findMaterial('__X_PRIMARY__');
		const secondaryMaterial = model.findMaterial('__X_SECONDARY__');

		const applyPrimaryColor = () => {
			const [r, g, b] = options.primaryColor;
			primaryMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		const applySecondaryColor = () => {
			const [r, g, b] = options.secondaryColor;
			secondaryMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyPrimaryColor();
		applySecondaryColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyPrimaryColor();
				applySecondaryColor();
			},
			interactions: {},
		};
	},
});
