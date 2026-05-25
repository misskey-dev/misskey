/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const book = defineObject({
	id: 'book',
	name: i18n.ts._miRoom._objects.book,
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: i18n.ts._miRoom._objects._book.variation,
				enum: [0, 1],
			},
			width: {
				type: 'range',
				label: i18n.ts._miRoom._objects._book.width,
				min: 0,
				max: 1,
				step: 0.01,
			},
			height: {
				type: 'range',
				label: i18n.ts._miRoom._objects._book.height,
				min: 0,
				max: 1,
				step: 0.01,
			},
			thickness: {
				type: 'range',
				label: i18n.ts._miRoom._objects._book.thickness,
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
			dispose: () => {},
		};
	},
});
