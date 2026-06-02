/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { defineFuniture } from '../furniture.js';
import { petBottle_schema } from 'misskey-world/src/room/furnitures/petBottle.schema.js';

export const petBottle = defineFuniture(petBottle_schema, {
	createInstance: ({ model, options, scene }) => {
		const capMesh = model.findMesh('__X_CAP__');
		const liquidMesh = model.findMesh('__X_LIQUID__');
		const labelMesh = model.findMesh('__X_LABEL__');
		const labelMaterial = model.findMaterial('__X_LABEL__');
		const liquidMaterial = model.findMaterial('__X_LIQUID__');

		labelMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
		labelMaterial.alphaCutOff = 0.5;

		const applyWithCap = () => {
			capMesh.isVisible = options.withCap;
		};

		const applyEmpty = () => {
			liquidMesh.isVisible = !options.empty;
		};

		const applyWithLabel = () => {
			labelMesh.isVisible = options.withLabel;
		};

		applyWithCap();
		applyEmpty();
		applyWithLabel();

		const applyVariation = () => {
			if (options.variation === 'mineral-water') {
				const tex = new BABYLON.Texture('/client-assets/world/objects/pet-bottle/textures/mineral-water.png', scene, false, false);
				labelMaterial.albedoTexture = tex;
				liquidMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
			} else if (options.variation === 'green-tea') {
				const tex = new BABYLON.Texture('/client-assets/world/objects/pet-bottle/textures/green-tea.png', scene, false, false);
				labelMaterial.albedoTexture = tex;
				liquidMaterial.albedoColor = new BABYLON.Color3(0.56, 0.44, 0);
			}
		};

		applyVariation();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'withCap': applyWithCap(); break;
					case 'empty': applyEmpty(); break;
					case 'withLabel': applyWithLabel(); break;
					case 'variation': applyVariation(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
