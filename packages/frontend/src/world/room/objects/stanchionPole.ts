/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const stanchionPole = defineObject({
	id: 'stanchionPole',
	name: i18n.ts._miRoom._objects.stanchionPole,
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._stanchionPole.bodyMat,
			},
			ropeMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._stanchionPole.ropeMat,
			},
		},
		default: {
			bodyMat: { color: [0.8, 0.39, 0.1], roughness: 0.2, metallic: 1 },
			ropeMat: { color: [0.21, 0.0, 0.0], roughness: 0.7, metallic: 0 },
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const ropeMaterial = model.findMaterial('__X_ROPE__');

		const applyRopeMat = () => {
			ropeMaterial.albedoColor = new BABYLON.Color3(options.ropeMat.color[0], options.ropeMat.color[1], options.ropeMat.color[2]);
			ropeMaterial.roughness = options.ropeMat.roughness;
			ropeMaterial.metallic = options.ropeMat.metallic;
		};

		applyRopeMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'ropeMat': applyRopeMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
