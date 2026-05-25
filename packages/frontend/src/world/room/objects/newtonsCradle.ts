/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const newtonsCradle = defineObject({
	id: 'newtonsCradle',
	name: i18n.ts._miRoom._objects.newtonsCradle,
	options: {
		schema: {
			frameMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._newtonsCradle.frameMat,
			},
		},
		default: {
			frameMat: { color: [0.15, 0.15, 0.15], roughness: 0.4, metallic: 0.8 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
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
