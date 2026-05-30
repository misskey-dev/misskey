/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../furniture.js';
import { chair_schema } from 'misskey-world/src/room/furnitures/chair.schema.js';

export const chair = defineFuniture(chair_schema, {
	createInstance: ({ model, options, sitChair }) => {
		const primaryMaterial = model.findMaterial('__X_PRIMARY__');
		const secondaryMaterial = model.findMaterial('__X_SECONDARY__');
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyPrimaryMat = () => {
			primaryMaterial.albedoColor = new BABYLON.Color3(options.primaryMat.color[0], options.primaryMat.color[1], options.primaryMat.color[2]);
			primaryMaterial.roughness = options.primaryMat.roughness;
			primaryMaterial.metallic = options.primaryMat.metallic;
		};

		const applySecondaryMat = () => {
			secondaryMaterial.albedoColor = new BABYLON.Color3(options.secondaryMat.color[0], options.secondaryMat.color[1], options.secondaryMat.color[2]);
			secondaryMaterial.roughness = options.secondaryMat.roughness;
			secondaryMaterial.metallic = options.secondaryMat.metallic;
		};

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyPrimaryMat();
		applySecondaryMat();
		applyFrameMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'primaryMat': applyPrimaryMat(); break;
					case 'secondaryMat': applySecondaryMat(); break;
					case 'frameMat': applyFrameMat(); break;
				}
			},
			interactions: {
				sit: {
					label: 'Sit',
					fn: () => {
						sitChair?.();
					},
				},
			},
			primaryInteraction: 'sit',
			dispose: () => {},
		};
	},
});
