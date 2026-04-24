/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
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
			customPicture: {
				type: 'image',
				label: 'Custom picture',
			},
			fit: {
				type: 'enum',
				label: 'Custom picture fit',
				enum: ['cover', 'contain', 'stretch'],
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
			customPicture: null,
			fit: 'cover',
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

		const updateUv = createPlaneUvMapper(pictureMesh);

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width * (1 - options.matHThickness);
			const targetHeight = options.height * (1 - options.matVThickness);
			const targetAspect = targetWidth / targetHeight;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

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

			applyFit();
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

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				pictureMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false, undefined, () => {
					pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
					pictureMaterial.albedoTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					pictureMaterial.albedoColor = new BABYLON.Color3(0, 1, 0);
					pictureMaterial.albedoTexture = null;
					resolve();
				});
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
			} else {
				pictureMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				pictureMaterial.albedoTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

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
				if (k === 'frameColor') {
					applyFrameColor();
				}
				if (k === 'width' || k === 'height') {
					applySize();
				}
				if (k === 'frameThickness') {
					applyFrameThickness();
				}
				if (k === 'depth') {
					applyDepth();
				}
				if (k === 'matHThickness' || k === 'matVThickness') {
					applyMatThickness();
				}
				if (k === 'customPicture') {
					applyCustomPicture();
				}
				if (k === 'fit') {
					applyFit();
				}
			},
			interactions: {},
		};
	},
});

/*

const applyDirection = () => {
	if (options.direction === 'vertical') {
		frameMesh.rotation.z = 0;
		matMesh.rotation.z = 0;
		coverMesh.rotation.z = 0;
		pictureMesh.rotation.z = 0;

		uvs[6] = ax;
		uvs[7] = ay;
		uvs[2] = bx;
		uvs[3] = by;
		uvs[4] = cx;
		uvs[5] = cy;
		uvs[0] = dx;
		uvs[1] = dy;
	} else if (options.direction === 'horizontal') {
		frameMesh.rotation.z = -Math.PI / 2;
		matMesh.rotation.z = -Math.PI / 2;
		coverMesh.rotation.z = -Math.PI / 2;
		pictureMesh.rotation.z = -Math.PI / 2;

		uvs[6] = cy;
		uvs[7] = cx;
		uvs[2] = dy;
		uvs[3] = dx;
		uvs[4] = ay;
		uvs[5] = ax;
		uvs[0] = by;
		uvs[1] = bx;
	}

	pictureMesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs);
};

*/
