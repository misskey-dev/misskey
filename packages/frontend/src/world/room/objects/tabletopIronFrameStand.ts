/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const tabletopIronFrameStand = defineObject({
	id: 'tabletopIronFrameStand',
	name: i18n.ts._miRoom._objects.tabletopIronFrameStand,
	options: {
		schema: {
			frameMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._tabletopIronFrameStand.frameMat,
			},
			boardMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._tabletopIronFrameStand.boardMat,
			},
			width: {
				type: 'range',
				label: i18n.ts._miRoom._objects._tabletopIronFrameStand.width,
				min: 0,
				max: 1,
				step: 0.01,
			},
			depth: {
				type: 'range',
				label: i18n.ts._miRoom._objects._tabletopIronFrameStand.depth,
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: i18n.ts._miRoom._objects._tabletopIronFrameStand.height,
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameMat: { color: [0.8, 0.8, 0.8], roughness: 0.3, metallic: 1 },
			boardMat: { color: [0.8, 0.4, 0.1], roughness: 0.6, metallic: 0 },
			width: 0.2,
			depth: 0.1,
			height: 0.05,
		},
	},
	placement: 'top',
	hasCollisions: false,
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
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('W') != null) {
					mesh.morphTargetManager.getTargetByName('W').influence = options.width;
				}
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('D') != null) {
					mesh.morphTargetManager.getTargetByName('D').influence = options.depth;
				}
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('H') != null) {
					mesh.morphTargetManager.getTargetByName('H').influence = options.height;
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
					case 'depth': applySize(); break;
					case 'height': applySize(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
