/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const wallShelf = defineObject({
	id: 'wallShelf',
	name: i18n.ts._miRoom._objects.wallShelf,
	options: {
		schema: {
			style: {
				type: 'enum',
				label: i18n.ts._miRoom._objects._wallShelf.style,
				enum: [{
					label: 'A',
					value: 'A',
				}, {
					label: 'B',
					value: 'B',
				}, {
					label: 'C',
					value: 'C',
				}, {
					label: 'D',
					value: 'D',
				}],
			},
			boardMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._wallShelf.boardMat,
			},
		},
		default: {
			style: 'A',
			boardMat: { color: [1, 1, 1], roughness: 0.5, metallic: 0 },
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

		const applyBoardMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.boardMat.color[0], options.boardMat.color[1], options.boardMat.color[2]);
			bodyMaterial.roughness = options.boardMat.roughness;
			bodyMaterial.metallic = options.boardMat.metallic;
		};

		applyBoardMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'style': applyStyle(); break;
					case 'boardMat': applyBoardMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
