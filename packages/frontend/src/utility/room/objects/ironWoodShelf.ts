/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const ironWoodShelfH = defineObject({
	id: 'ironWoodShelfH',
	name: 'ironWoodShelf H',
	path: 'iron-wood-shelf/iron-wood-shelf-h',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
		},
		default: {
			frameColor: [0.2, 0.2, 0.2],
		},
	},
	placement: 'floor',
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
			},
			interactions: {},
		};
	},
});

export const ironWoodShelfV = defineObject({
	id: 'ironWoodShelfV',
	name: 'ironWoodShelf V',
	path: 'iron-wood-shelf/iron-wood-shelf-v',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
		},
		default: {
			frameColor: [0.2, 0.2, 0.2],
		},
	},
	placement: 'floor',
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
			},
			interactions: {},
		};
	},
});
