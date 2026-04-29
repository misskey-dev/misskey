/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const newtonsCradle = defineObject({
	id: 'newtonsCradle',
	name: 'newtonsCradle',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
		},
		default: {
			frameColor: [0.15, 0.15, 0.15],
		},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameColor': applyFrameColor(); break;
				}
			},
			interactions: {},
		};
	},
});
