/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const speaker = defineObject({
	id: 'speaker',
	name: 'Speaker',
	options: {
		schema: {
			outerColor: {
				type: 'color',
				label: 'Outer Color',
			},
			innerColor: {
				type: 'color',
				label: 'Inner Color',
			},
		},
		default: {
			outerColor: [0.45, 0.8, 0],
			innerColor: [0, 0, 0],
		},
	},
	placement: 'top',
	createInstance: ({ options, root }) => {
		const outerMesh = root.getChildMeshes().find(m => m.name.includes('__X_COVER__')) as BABYLON.Mesh;
		const outerMaterial = outerMesh.material as BABYLON.PBRMaterial;

		const innerMesh = root.getChildMeshes().find(m => m.name.includes('__X_BODY__')) as BABYLON.Mesh;
		const innerMaterial = innerMesh.material as BABYLON.PBRMaterial;

		const applyOuterColor = () => {
			const [r, g, b] = options.outerColor;
			outerMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		const applyInnerColor = () => {
			const [r, g, b] = options.innerColor;
			innerMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyOuterColor();
		applyInnerColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyOuterColor();
				applyInnerColor();
			},
			interactions: {},
		};
	},
});
