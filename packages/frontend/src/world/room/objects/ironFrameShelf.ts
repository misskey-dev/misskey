/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject, defineObjectClass } from '../object.js';
import { i18n } from '@/i18n.js';

const base = defineObjectClass({
	options: {
		schema: {
			frameMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._ironFrameShelf.frameMat,
			},
			boardMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._ironFrameShelf.boardMat,
			},
			width: {
				type: 'range',
				label: i18n.ts._miRoom._objects._ironFrameShelf.width,
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameMat: { color: [0.2, 0.2, 0.2], roughness: 0.4, metallic: 1 },
			boardMat: { color: [0.8, 0.4, 0.1], roughness: 0.7, metallic: 0 },
			width: 0.2,
		},
	},
	placement: 'floor',
	hasCollisions: true,
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');
		const boardMaterial = model.findMaterial('__X_BOARD__');

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		const applyBoardMat = () => {
			boardMaterial.albedoColor = new BABYLON.Color3(options.boardMat.color[0], options.boardMat.color[1], options.boardMat.color[2]);
			boardMaterial.roughness = options.boardMat.roughness;
			boardMaterial.metallic = options.boardMat.metallic;
		};

		applyBoardMat();

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
					case 'frameMat': applyFrameMat(); break;
					case 'boardMat': applyBoardMat(); break;
					case 'width': applySize(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});

export const ironFrameShelf5 = base.extend({
	id: 'ironFrameShelf5',
	name: i18n.ts._miRoom._objects.ironFrameShelf5,
	path: () => 'iron-frame-shelf/iron-frame-shelf-5',
});

export const ironFrameShelf4 = base.extend({
	id: 'ironFrameShelf4',
	name: i18n.ts._miRoom._objects.ironFrameShelf4,
	path: () => 'iron-frame-shelf/iron-frame-shelf-4',
});

export const ironFrameShelf3 = base.extend({
	id: 'ironFrameShelf3',
	name: i18n.ts._miRoom._objects.ironFrameShelf3,
	path: () => 'iron-frame-shelf/iron-frame-shelf-3',
});
