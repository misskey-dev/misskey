/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const pc = defineObject({
	id: 'pc',
	name: 'PC',
	options: {
		schema: {
			mat: {
				type: 'material',
				label: 'Material',
			},
		},
		default: {
			mat: { color: [0, 0, 0], roughness: -1, metallic: -1 },
		},
	},
	placement: 'top',
	createInstance: ({ options, root, id }) => {
		const bodyMesh = root.getChildMeshes().find(m => m.name.includes('__X_BODY__')) as BABYLON.Mesh;
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;
		console.log(id, bodyMaterial.roughness, bodyMaterial.metallic);

		const applyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			bodyMaterial.roughness = options.mat.roughness;
			bodyMaterial.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyMat();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
