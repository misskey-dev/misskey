/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const wallMirror = defineObject({
	id: 'wallMirror',
	name: 'wallMirror',
	options: {
		schema: {
			width: {
				type: 'range',
				label: 'Width',
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
			frameThickness: {
				type: 'range',
				label: 'Frame thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			frameMat: {
				type: 'material',
				label: 'Frame material',
			},
		},
		default: {
			width: 0.2,
			height: 0.2,
			frameThickness: 0.1,
			frameMat: { color: [0.8, 0.28, 0.06], roughness: 0.5, metallic: 0 },
		},
	},
	placement: 'side',
	hasCollisions: false,
	createInstance: async ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');
		const frameMesh = model.findMesh('__X_FRAME__');
		const mirrorMesh = model.findMesh('__X_MIRROR__');

		const applySize = () => {
			frameMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			frameMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			frameMesh.morphTargetManager!.getTargetByName('FrameThickness')!.influence = options.frameThickness;
			mirrorMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			mirrorMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			model.updated();
		};

		applySize();

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
					case 'frameThickness':
						applySize();
						break;
					case 'frameMat':
						applyFrameMat();
						break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
