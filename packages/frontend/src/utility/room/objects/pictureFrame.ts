/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const pictureFrame = defineObject({
	id: 'pictureFrame',
	name: 'Picture Frame',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
		},
		default: {
			frameColor: [0.71, 0.58, 0.39],
		},
	},
	placement: 'side',
	createInstance: ({ room, root, options, findMaterial }) => {
		const frameMaterial = findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
			},
			interactions: {},
		};
	},
});
