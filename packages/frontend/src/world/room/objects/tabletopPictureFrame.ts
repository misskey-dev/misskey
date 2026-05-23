/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { createPlaneUvMapper } from '../../utility.js';

// NOTE: シェイプキーのnormalのエクスポートは無効にしないとmatを大きくしたときに面のレンダリングがグリッチする

export const tabletopPictureFrame = defineObject({
	id: 'tabletopPictureFrame',
	name: 'Tabletop simple picture frame',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
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
			depth: {
				type: 'range',
				label: 'Depth',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matHThickness: {
				type: 'range',
				label: 'Mat horizontal thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			matVThickness: {
				type: 'range',
				label: 'Mat vertical thickness',
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
			frameColor: [0.71, 0.58, 0.39],
			width: 0.07,
			height: 0.07,
			frameThickness: 0.1,
			depth: 0,
			matHThickness: 0,
			matVThickness: 0,
			image: { type: null },
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ scene, options, model }) => {
		const frameMesh = model.findMesh('__X_FRAME__');
		frameMesh.rotationQuaternion = null;
		const matMesh = model.findMesh('__X_MAT__');
		matMesh.rotationQuaternion = null;
		const coverMesh = model.findMesh('__X_COVER__');
		coverMesh.rotationQuaternion = null;
		const pictureMesh = model.findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;

		const pictureMaterial = model.findMaterial('__X_PICTURE__');
		pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(pictureMesh, () => {
			const targetWidth = options.width * (1 - options.matHThickness);
			const targetHeight = options.height * (1 - options.matVThickness);
			return targetWidth / targetHeight;
		}, scene);

		const applyFrameThickness = () => {
			frameMesh.morphTargetManager!.getTargetByName('Thickness')!.influence = options.frameThickness;
			coverMesh.morphTargetManager!.getTargetByName('FrameThickness')!.influence = options.frameThickness;
			matMesh.morphTargetManager!.getTargetByName('FrameThickness')!.influence = options.frameThickness;
			pictureMesh.morphTargetManager!.getTargetByName('FrameThickness')!.influence = options.frameThickness;
			model.updated();
		};

		applyFrameThickness();

		const applyMatThickness = () => {
			matMesh.morphTargetManager!.getTargetByName('MatH')!.influence = options.matHThickness * options.width;
			matMesh.morphTargetManager!.getTargetByName('MatV')!.influence = options.matVThickness * options.height;
			pictureMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width * (1 - options.matHThickness);
			pictureMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height * (1 - options.matVThickness);
			pictureMesh.morphTargetManager!.getTargetByName('MatH')!.influence = options.matHThickness * options.width;
			pictureMesh.morphTargetManager!.getTargetByName('MatV')!.influence = options.matVThickness * options.height;
			matMesh.isVisible = options.matHThickness > 0 || options.matVThickness > 0;
			model.updated();

			textureManager.applyFit();
		};

		applyMatThickness();

		const applySize = () => {
			frameMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			frameMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			matMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			matMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			coverMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			coverMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			model.updated();

			applyMatThickness();
		};

		applySize();

		const applyDepth = () => {
			frameMesh.morphTargetManager!.getTargetByName('Depth')!.influence = options.depth;
			//coverMesh.morphTargetManager!.getTargetByName('Depth')!.influence = options.depth;
			coverMesh.morphTargetManager!.getTargetByName('Depth')!.influence = 0;
			model.updated();
		};

		applyDepth();

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

		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameColor = () => {
			const [r, g, b] = options.frameColor;
			frameMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyFrameColor();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameColor': applyFrameColor(); break;
					case 'width':
					case 'height': applySize(); break;
					case 'frameThickness': applyFrameThickness(); break;
					case 'depth': applyDepth(); break;
					case 'matHThickness':
					case 'matVThickness': applyMatThickness(); break;
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
