/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFuniture } from '../furniture.js';
import { bed_schema } from 'misskey-world/src/room/furnitures/bed.schema.js';

export const bed = defineFuniture(bed_schema, {
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyFrameMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			bodyMaterial.roughness = options.frameMat.roughness;
			bodyMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameMat': applyFrameMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
