/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const pictureFrame = defineObject({
	id: 'pictureFrame',
	name: 'Rectangular picture frame',
	options: {
		schema: {
			frameColor: {
				type: 'color',
				label: 'Frame color',
			},
			direction: {
				type: 'enum',
				label: 'Direction',
				enum: ['vertical', 'horizontal'],
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
		},
		default: {
			frameColor: [0.71, 0.58, 0.39],
			direction: 'vertical',
			matHThickness: 0.125,
			matVThickness: 0.15,
			customPicture: null,
		},
	},
	placement: 'side',
	createInstance: ({ room, root, options, findMaterial, findMesh }) => {
		const frameMesh = findMesh('__X_FRAME__');
		frameMesh.rotationQuaternion = null;
		const matMesh = findMesh('__X_MAT__');
		matMesh.rotationQuaternion = null;
		const coverMesh = findMesh('__X_COVER__');
		coverMesh.rotationQuaternion = null;
		const pictureMesh = findMesh('__X_PICTURE__');
		pictureMesh.rotationQuaternion = null;
		pictureMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		const uvs = pictureMesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
		const ax = uvs[6];
		const ay = uvs[7];
		const bx = uvs[2];
		const by = uvs[3];
		const cx = uvs[4];
		const cy = uvs[5];
		const dx = uvs[0];
		const dy = uvs[1];

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

		applyDirection();

		const applyMatThickness = () => {
			matMesh.morphTargetManager!.getTargetByName('MatH')!.influence = options.matHThickness;
			matMesh.morphTargetManager!.getTargetByName('MatV')!.influence = options.matVThickness;
			pictureMesh.morphTargetManager!.getTargetByName('PictureH')!.influence = options.matHThickness;
			pictureMesh.morphTargetManager!.getTargetByName('PictureV')!.influence = options.matVThickness;
		};

		applyMatThickness();

		const pictureMaterial = findMaterial('__X_PICTURE__');

		const applyCustomPicture = () => {
			if (options.customPicture != null) {
				const tex = new BABYLON.Texture(options.customPicture, room.scene, false, false);

				pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
				pictureMaterial.albedoTexture = tex;
			} else {
				pictureMaterial.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
				pictureMaterial.albedoTexture = null;
			}
		};

		applyCustomPicture();

		const frameMaterial = findMaterial('__X_FRAME__');

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
				if (k === 'direction') {
					applyDirection();
				}
				if (k === 'matHThickness' || k === 'matVThickness') {
					applyMatThickness();
				}
				if (k === 'customPicture') {
					applyCustomPicture();
				}
			},
			interactions: {},
		};
	},
});
