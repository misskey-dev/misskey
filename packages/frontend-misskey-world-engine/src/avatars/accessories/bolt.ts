/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { bolt_schema } from 'misskey-world/src/avatars/accessories/bolt.schema.js';
import { defineAccessory } from '../accessory.js';

export const bolt = defineAccessory(bolt_schema, {
	createInstance: ({ model, options }) => {
		const material = model.findMaterial('__X_BOLT__');

		const applyMat = () => {
			material.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			material.roughness = options.mat.roughness;
			material.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'mat': applyMat(); break;
				}
			},
			dispose: () => {
			},
		};
	},
});
