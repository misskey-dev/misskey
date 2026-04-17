/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const wallShelf = defineObject({
	id: 'wallShelf',
	name: 'Wall Shelf',
	options: {
		schema: {
			style: {
				type: 'enum',
				label: 'Style',
				enum: ['A', 'B', 'C', 'D'],
			},
			boardStyle: {
				type: 'enum',
				label: 'Board style',
				enum: ['color', 'wood'],
			},
			boardColor: {
				type: 'color',
				label: 'Board color',
			},
		},
		default: {
			style: 'A',
			boardStyle: 'wood',
			boardColor: [1, 1, 1],
		},
	},
	placement: 'side',
	createInstance: ({ model, options }) => {
		const applyStyle = () => {
			const aMeshes = model.findMeshes('__X_VARIATION_A__');
			const bMeshes = model.findMeshes('__X_VARIATION_B__');
			const cMeshes = model.findMeshes('__X_VARIATION_C__');
			const dMeshes = model.findMeshes('__X_VARIATION_D__');

			for (const m of aMeshes) {
				m.isVisible = options.style === 'A';
			}
			for (const m of bMeshes) {
				m.isVisible = options.style === 'B';
			}
			for (const m of cMeshes) {
				m.isVisible = options.style === 'C';
			}
			for (const m of dMeshes) {
				m.isVisible = options.style === 'D';
			}

			model.updated();
		};

		applyStyle();

		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;
		const bodyTexture = bodyMaterial.albedoTexture as BABYLON.Texture;

		const applyBoardColor = () => {
			const [r, g, b] = options.boardColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);

			if (options.boardStyle === 'color') {
				bodyMaterial.albedoTexture = null;
			} else {
				bodyMaterial.albedoTexture = bodyTexture;
			}
		};

		applyBoardColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyStyle();
				applyBoardColor();
			},
			interactions: {},
		};
	},
});
