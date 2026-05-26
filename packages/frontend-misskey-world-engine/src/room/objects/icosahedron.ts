/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { icosahedron_schema } from 'misskey-world/src/room/objects/icosahedron.schema.js';

export const icosahedron = defineObject(icosahedron_schema, {
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			bodyMaterial.roughness = options.mat.roughness;
			bodyMaterial.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'mat': applyMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
