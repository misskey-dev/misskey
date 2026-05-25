/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const cuboid = defineObject({
	id: 'cuboid',
	name: i18n.ts._miRoom._objects.cuboid,
	options: {
		schema: {
			x: {
				type: 'range',
				label: i18n.ts._miRoom._objects._cuboid.x,
				min: 0,
				max: 1,
				step: 0.01,
			},
			y: {
				type: 'range',
				label: i18n.ts._miRoom._objects._cuboid.y,
				min: 0,
				max: 1,
				step: 0.01,
			},
			z: {
				type: 'range',
				label: i18n.ts._miRoom._objects._cuboid.z,
				min: 0,
				max: 1,
				step: 0.01,
			},
			mat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._cuboid.mat,
			},
		},
		default: {
			x: 0.01,
			y: 0.01,
			z: 0.01,
			mat: { color: [1, 1, 1], roughness: 0, metallic: 0 },
		},
	},
	placement: 'top',
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
