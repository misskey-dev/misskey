/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { remap } from 'misskey-world/src/utility.js';
import { wallGlassPictureFrame_schema } from 'misskey-world/src/room/furnitures/wallGlassPictureFrame.schema.js';
import { createTextureManager, defineFuniture } from '../furniture.js';

export const wallGlassPictureFrame = defineFuniture(wallGlassPictureFrame_schema, {
	createInstance: async ({ scene, options, model }) => {
		const pictureMesh = model.findMesh('__X_PICTURE__');
		const frameMesh = model.findMesh('__X_FRAME__');
		const pinMeshes = model.findMeshes('__X_PIN__');
		const pictureMaterial = model.findMaterial('__X_PICTURE__');
		pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(pictureMesh, () => {
			const targetWidth = remap(options.width, 0, 1, 2, 172); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは172cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			const targetHeight = remap(options.height, 0, 1, 2, 172); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは172cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			return targetWidth / targetHeight;
		}, scene);

		const applySize = () => {
			pictureMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			pictureMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			frameMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			frameMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			for (const pinMesh of pinMeshes) {
				pinMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
				pinMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			}
			model.updated();

			textureManager.calcUv();
		};

		applySize();

		const applyImage = () => {
			pictureMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit, options.image.rotation).then((tex) => {
				pictureMaterial.albedoTexture = tex;
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
