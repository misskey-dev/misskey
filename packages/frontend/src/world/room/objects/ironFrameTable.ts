/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const ironFrameTable = defineObject({
	id: 'ironFrameTable',
	name: 'ironFrameTable',
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
			depth: {
				type: 'range',
				label: 'Depth',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: 'Height',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			frameColor: [0.8, 0.8, 0.8],
			boardColor: [0.8, 0.4, 0.1],
			width: 0.28,
			depth: 0.25,
			height: 0.35,
		},
	},
	placement: 'top',
	hasCollisions: true,
	createInstance: ({ options, model, stickyMarkerMeshUpdated }) => {
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

		const topMesh = model.findMesh('__TOP__');

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
					case 'frameColor': applyFrameColor(); break;
					case 'boardColor': applyBoardColor(); break;
					case 'width': applySize(); stickyMarkerMeshUpdated?.(topMesh); break;
					case 'depth': applySize(); stickyMarkerMeshUpdated?.(topMesh); break;
					case 'height': applySize(); stickyMarkerMeshUpdated?.(topMesh); break;
				}
			},
			interactions: {},
		};
	},
});
