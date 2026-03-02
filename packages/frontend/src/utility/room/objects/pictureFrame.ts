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
		},
		default: {
			frameColor: [0.71, 0.58, 0.39],
			direction: 'vertical',
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

		//matMesh.morphTargetManager!.getTargetByName('MatH')!.influence = 0.6;
		//matMesh.morphTargetManager!.getTargetByName('MatV')!.influence = 0.6;
		//pictureMesh.morphTargetManager!.getTargetByName('PictureH')!.influence = 0.6;
		//pictureMesh.morphTargetManager!.getTargetByName('PictureV')!.influence = 0.6;

		const tex = new BABYLON.Texture('http://syu-win.local:3000/files/b6cefaba-3093-4c57-a7f8-993dee62c6f7', room.scene, false, false);

		const pictureMaterial = findMaterial('__X_PICTURE__');
		pictureMaterial.albedoColor = new BABYLON.Color3(1, 1, 1);
		pictureMaterial.albedoTexture = tex;

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
			},
			interactions: {},
		};
	},
});
