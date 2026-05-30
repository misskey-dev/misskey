/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineFuniture } from '../object.js';
import { wallCanvas_schema } from 'misskey-world/src/room/objects/wallCanvas.schema.js';

export const wallCanvas = defineFuniture(wallCanvas_schema, {
	createInstance: async ({ scene, options, model }) => {
		const canvasMesh = model.findMesh('__X_CANVAS__');
		canvasMesh.rotationQuaternion = null;

		const canvasMaterial = model.findMaterial('__X_CANVAS__');
		canvasMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(canvasMesh, () => {
			const targetWidth = options.width;
			const targetHeight = options.height;
			return targetWidth / targetHeight;
		}, scene);

		const applySize = () => {
			canvasMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			canvasMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			model.updated();

			textureManager.applyFit();
		};

		applySize();

		const applyImage = () => {
			canvasMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				canvasMaterial.albedoTexture = tex;
			});
		};

		await applyImage();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
						applySize();
						break;
					case 'image':
						applyImage();
						break;
				}
			},
			interactions: {},
			dispose: () => {
				textureManager.dispose();
			},
		};
	},
});
