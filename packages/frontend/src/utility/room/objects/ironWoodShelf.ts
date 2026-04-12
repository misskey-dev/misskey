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
			boardColor: {
				type: 'color',
				label: 'Board color',
			},
		},
		default: {
			frameColor: [0.2, 0.2, 0.2],
			boardColor: [0.8, 0.4, 0.1],
		},
	},
	placement: 'floor',
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');
		const boardMaterial = model.findMaterial('__X_BOARD__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		const applyBoardColor = () => {
			const [r, g, b] = options.boardColor;
			boardMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBoardColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
				applyBoardColor();
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
			boardColor: {
				type: 'color',
				label: 'Board color',
			},
		},
		default: {
			frameColor: [0.2, 0.2, 0.2],
			boardColor: [0.8, 0.4, 0.1],
		},
	},
	placement: 'floor',
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');
		const boardMaterial = model.findMaterial('__X_BOARD__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		const applyBoardColor = () => {
			const [r, g, b] = options.boardColor;
			boardMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBoardColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyFrameColor();
				applyBoardColor();
			},
			interactions: {},
		};
	},
});
