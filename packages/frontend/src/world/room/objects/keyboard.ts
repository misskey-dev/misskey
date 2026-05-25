/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const keyboard = defineObject({
	id: 'keyboard',
	name: i18n.ts._miRoom._objects.keyboard,
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._keyboard.bodyMat,
			},
			keyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._keyboard.keyMat,
			},
		},
		default: {
			bodyMat: { color: [0.3, 0.3, 0.3], roughness: 0.6, metallic: 0 },
			keyMat: { color: [0.2, 0.2, 0.2], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
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
