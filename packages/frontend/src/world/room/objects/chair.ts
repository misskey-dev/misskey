/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const chair = defineObject({
	id: 'chair',
	name: i18n.ts._miRoom._objects.chair,
	options: {
		schema: {
			primaryMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._chair.primaryMat,
			},
			secondaryMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._chair.secondaryMat,
			},
			frameMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._chair.frameMat,
			},
		},
		default: {
			primaryMat: { color: [0.44, 0.6, 0], roughness: 1, metallic: 0 },
			secondaryMat: { color: [0, 0, 0], roughness: 0.5, metallic: 0 },
			frameMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 1 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	isChair: true,
	canPreMeshesMerging: true,
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
