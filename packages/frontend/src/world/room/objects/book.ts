/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const book = defineObject({
	id: 'book',
	name: 'Book',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: [0, 1],
			},
			width: {
				type: 'range',
				label: 'Width',
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: 'Height',
				min: 0,
				max: 1,
				step: 0.01,
			},
			thickness: {
				type: 'range',
				label: 'thickness',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			variation: 0,
			width: 0.07,
			height: 0.07,
			thickness: 0.1,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');

		const applySize = () => {
			bodyMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			bodyMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			bodyMesh.morphTargetManager!.getTargetByName('Thickness')!.influence = options.thickness;
			model.updated();
		};

		applySize();

		return {
			onInited: () => {
			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
					case 'thickness':
						applySize();
						break;
				}
			},
			interactions: {},
		};
	},
});
