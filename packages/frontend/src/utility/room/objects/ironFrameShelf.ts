/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject, defineObjectClass } from '../engine.js';

const base = defineObjectClass({
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
			width: {
				type: 'range',
				label: 'Width',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameColor: [0.2, 0.2, 0.2],
			boardColor: [0.8, 0.4, 0.1],
			width: 0.2,
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

		const applySize = () => {
			for (const mesh of model.root.getChildMeshes()) {
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('Width') != null) {
					mesh.morphTargetManager.getTargetByName('Width').influence = options.width;
				}
			}
			model.updated();
		};

		applySize();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameColor': applyFrameColor(); break;
					case 'boardColor': applyBoardColor(); break;
					case 'width': applySize(); break;
				}
			},
			interactions: {},
		};
	},
});

export const ironFrameShelf5 = base.extend({
	id: 'ironFrameShelf5',
	name: 'ironFrameShelf 5',
	path: 'iron-frame-shelf/iron-frame-shelf-5',
});

export const ironFrameShelf4 = base.extend({
	id: 'ironFrameShelf4',
	name: 'ironFrameShelf 4',
	path: 'iron-frame-shelf/iron-frame-shelf-4',
});

export const ironFrameShelf3 = base.extend({
	id: 'ironFrameShelf3',
	name: 'ironFrameShelf 3',
	path: 'iron-frame-shelf/iron-frame-shelf-3',
});
