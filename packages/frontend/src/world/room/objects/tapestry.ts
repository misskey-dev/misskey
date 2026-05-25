/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { remap } from '@/world/utility.js';

export const tapestry = defineObject({
	id: 'tapestry',
	options: {
		schema: {
			width: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				presets: [],
			},
		},
		default: {
			width: 0.15,
			height: 0.15,
			image: { type: null },
		},
	},
	placement: 'side',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const pictureMesh = model.findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;

		const pipeTopMesh = model.findMesh('__X_PIPE_TOP__');
		const pipeBottomMesh = model.findMesh('__X_PIPE_BOTTOM__');
		const ropeMesh = model.findMesh('__X_ROPE__');

		const pictureMaterial = model.findMaterial('__X_PICTURE__');
		pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(pictureMesh, () => {
			const targetWidth = remap(options.width, 0, 1, 2, 100); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは100cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			const targetHeight = remap(options.height, 0, 1, 2, 100); // 最小値(値を0にした場合)でのサイズは2cmで、最大値(値を1にした場合)でのサイズは100cmなので。比率の計算だから単位はなんでもいいけど、とにかく0が0にならない点を考慮させる必要がある
			return targetWidth / targetHeight;
		}, scene);

		const applySize = () => {
			pictureMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			pictureMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			pipeTopMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			pipeTopMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			pipeBottomMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			pipeBottomMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			ropeMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			ropeMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
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
					case 'height': applySize(); break;
					case 'image': applyImage(); break;
				}
			},
			interactions: {},
			dispose: () => {
				textureManager.dispose();
			},
		};
	},
});
