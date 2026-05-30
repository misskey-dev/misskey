/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../object.js';
import { tabletopIronFrameStand_schema } from 'misskey-world/src/room/objects/tabletopIronFrameStand.schema.js';

export const tabletopIronFrameStand = defineFuniture(tabletopIronFrameStand_schema, {
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
