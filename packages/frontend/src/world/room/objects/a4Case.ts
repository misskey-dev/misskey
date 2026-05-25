/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const a4Case = defineObject({
	id: 'a4Case',
	name: i18n.ts._miRoom._objects.a4Case,
	options: {
		schema: {
			mat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._a4Case.mat,
			},
		},
		default: {
			mat: { color: [0.9, 0.9, 0.9], roughness: 0.3, metallic: 0 },
		},
	},
	placement: 'top',
	hasCollisions: false,
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			bodyMaterial.roughness = options.mat.roughness;
			bodyMaterial.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onOptionsUpdated: ([k, _v]) => {
				applyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
