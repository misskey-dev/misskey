/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { keyboard_schema } from 'misskey-world/src/room/objects/keyboard.schema.js';

export const keyboard = defineObject(keyboard_schema, {
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const keyMaterial = model.findMaterial('__X_KEY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const applyKeyMat = () => {
			keyMaterial.albedoColor = new BABYLON.Color3(options.keyMat.color[0], options.keyMat.color[1], options.keyMat.color[2]);
			keyMaterial.roughness = options.keyMat.roughness;
			keyMaterial.metallic = options.keyMat.metallic;
		};

		applyKeyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'keyMat': applyKeyMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
