/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { pictureFrame_schema } from 'misskey-world/src/room/objects/pictureFrame.schema.js';

// NOTE: シェイプキーのnormalのエクスポートは無効にしないとmatを大きくしたときに面のレンダリングがグリッチする

export const pictureFrame = defineObject(pictureFrame_schema, {
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
			model.updated();
		};

		applyFrameThickness();

		const applyMatThickness = () => {
			matMesh.morphTargetManager!.getTargetByName('MatH')!.influence = options.matHThickness * options.width;
			matMesh.morphTargetManager!.getTargetByName('MatV')!.influence = options.matVThickness * options.height;
			pictureMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width * (1 - options.matHThickness);
			pictureMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height * (1 - options.matVThickness);
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

		const applyWithCover = () => {
			coverMesh.isVisible = options.withCover;
			model.updated();
		};

		applyWithCover();

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
					case 'frameMat': applyFrameMat(); break;
					case 'width':
					case 'height': applySize(); break;
					case 'frameThickness': applyFrameThickness(); break;
					case 'matHThickness':
					case 'matVThickness': applyMatThickness(); break;
					case 'depth': applyDepth(); break;
					case 'withCover': applyWithCover(); break;
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
