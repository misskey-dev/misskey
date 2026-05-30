/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../object.js';
import { wallMirror_schema } from 'misskey-world/src/room/objects/wallMirror.schema.js';

export const wallMirror = defineFuniture(wallMirror_schema, {
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
