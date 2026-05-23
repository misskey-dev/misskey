/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { createPlaneUvMapper, getPlaneUvIndexes } from '../../utility.js';

const remap = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
};

export const wallGlassPictureFrame = defineObject({
	id: 'wallGlassPictureFrame',
	name: 'wallGlassPictureFrame',
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
			image: {
				type: 'image',
				label: 'Image',
				presets: [],
			},
		},
		default: {
			width: 0.1,
			height: 0.1,
			image: { type: null },
		},
	},
	placement: 'wall',
	hasCollisions: false,
	hasTexture: true,
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

			textureManager.applyFit();
		};

		applySize();

		const applyImage = () => {
			pictureMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
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
