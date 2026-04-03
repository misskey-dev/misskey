/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { createPlaneUvMapper, getPlaneUvIndexes } from '../utility.js';

export const tapestry = defineObject({
	id: 'tapestry',
	name: 'Tapestry',
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
			width: 0.15,
			height: 0.15,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'side',
	createInstance: async ({ scene, options, model }) => {
		const pictureMesh = model.findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;

		const pipeTopMesh = model.findMesh('__X_PIPE_TOP__');
		const pipeBottomMesh = model.findMesh('__X_PIPE_BOTTOM__');
		const ropeMesh = model.findMesh('__X_ROPE__');

		const pictureMaterial = model.findMaterial('__X_PICTURE__');

		const updateUv = createPlaneUvMapper(pictureMesh);

		const applyFit = () => {
			const tex = pictureMaterial.albedoTexture;
			if (tex == null) return;

			const srcWidth = tex.getSize().width;
			const srcHeight = tex.getSize().height;
			const srcAspect = srcWidth / srcHeight;
			const targetWidth = options.width;
			const targetHeight = options.height;
			const targetAspect = targetWidth / targetHeight;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

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

			applyFit();
		};

		applySize();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false);
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;

				pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
				pictureMaterial.albedoTexture = tex;

				tex.onLoadObservable.addOnce(() => {
					applyFit();
					resolve();
				});
			} else {
				pictureMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				pictureMaterial.albedoTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				if (k === 'width' || k === 'height') {
					applySize();
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
