/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const wallShelf = defineObject({
	id: 'wallShelf',
	name: 'Wall Shelf',
	options: {
		schema: {
			style: {
				type: 'enum',
				label: 'Style',
				enum: ['A', 'B'],
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
	createInstance: ({ room, options, root }) => {
		const applyStyle = () => {
			const aMeshes = root.getChildMeshes().filter(m => m.name.includes('__X_VARIATION_A__'));
			const bMeshes = root.getChildMeshes().filter(m => m.name.includes('__X_VARIATION_B__'));

			for (const m of aMeshes) {
				(m as BABYLON.Mesh).setEnabled(options.style === 'A');
			}
			for (const m of bMeshes) {
				(m as BABYLON.Mesh).setEnabled(options.style === 'B');
			}
		};

		applyStyle();

		const bodyMesh = root.getChildMeshes().find(m => m.name.includes('__X_BOARD__')) as BABYLON.Mesh;
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
