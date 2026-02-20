/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const colorBox = defineObject({
	id: 'colorBox',
	name: 'Color Box',
	options: {
		schema: {
			color: {
				type: 'color',
				label: 'Color',
			},
		},
		default: {
			color: [1, 1, 1],
		},
	},
	placement: 'floor',
	createInstance: ({ options, root }) => {
		const bodyMesh = root.getChildMeshes().find(m => m.name.includes('__X_BODY__')) as BABYLON.Mesh;
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyColor = () => {
			const [r, g, b] = options.color;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyColor();
			},
			interactions: {},
		};
	},
});
