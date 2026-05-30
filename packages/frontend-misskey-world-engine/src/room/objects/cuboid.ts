/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../object.js';
import { cuboid_schema } from 'misskey-world/src/room/objects/cuboid.schema.js';

export const cuboid = defineFuniture(cuboid_schema, {
	createInstance: async ({ scene, options, model }) => {
		const mesh = model.findMesh('__X_BODY__');
		const mat = model.findMaterial('__X_BODY__');

		const applySize = () => {
			mesh.morphTargetManager!.getTargetByName('X')!.influence = options.x;
			mesh.morphTargetManager!.getTargetByName('Y')!.influence = options.y;
			mesh.morphTargetManager!.getTargetByName('Z')!.influence = options.z;
			model.updated();
		};

		applySize();

		const applyMat = () => {
			mat.albedoColor = new BABYLON.Color3(options.mat.color[0], options.mat.color[1], options.mat.color[2]);
			mat.roughness = options.mat.roughness;
			mat.metallic = options.mat.metallic;
		};

		applyMat();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'mat':
						applyMat();
						break;
					case 'x':
					case 'y':
					case 'z':
						applySize();
						break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
