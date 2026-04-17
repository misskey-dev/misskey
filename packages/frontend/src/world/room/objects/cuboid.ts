/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const cuboid = defineObject({
	id: 'cuboid',
	name: 'cuboid',
	options: {
		schema: {
			x: {
				type: 'range',
				label: 'X',
				min: 0,
				max: 1,
				step: 0.01,
			},
			y: {
				type: 'range',
				label: 'Y',
				min: 0,
				max: 1,
				step: 0.01,
			},
			z: {
				type: 'range',
				label: 'Z',
				min: 0,
				max: 1,
				step: 0.01,
			},
			color: {
				type: 'color',
				label: 'Color',
			},
		},
		default: {
			x: 0.01,
			y: 0.01,
			z: 0.01,
			color: [1, 1, 1],
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

		const applyColor = () => {
			const [r, g, b] = options.color;
			mat.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyColor();

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'color':
						applyColor();
						break;
					case 'x':
					case 'y':
					case 'z':
						applySize();
						break;
				}
			},
			interactions: {},
		};
	},
});
