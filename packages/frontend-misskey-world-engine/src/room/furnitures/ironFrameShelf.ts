/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { defineFuniture } from '../furniture.js';
import { ironFrameShelf_schema } from 'misskey-world/src/room/furnitures/ironFrameShelf.schema.js';

export const ironFrameShelf = defineFuniture(ironFrameShelf_schema, {
	path: (options) => {
		switch (options.height) {
			case '5': return 'iron-frame-shelf/iron-frame-shelf-5';
			case '4': return 'iron-frame-shelf/iron-frame-shelf-4';
			case '3': return 'iron-frame-shelf/iron-frame-shelf-3';
		}
	},
	createInstance: ({ options, model, reloadModel }) => {
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
					case 'height': reloadModel(); break;
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
