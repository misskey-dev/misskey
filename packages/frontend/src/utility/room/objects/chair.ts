/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

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
	isChair: true,
	createInstance: ({ root, options }) => {
		const primaryMesh = root.getChildMeshes().find(m => m.name.includes('__X_PRIMARY__')) as BABYLON.Mesh;
		const primaryMaterial = primaryMesh.material as BABYLON.PBRMaterial;

		const secondaryMesh = root.getChildMeshes().find(m => m.name.includes('__X_SECONDARY__')) as BABYLON.Mesh;
		const secondaryMaterial = secondaryMesh.material as BABYLON.PBRMaterial;

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
