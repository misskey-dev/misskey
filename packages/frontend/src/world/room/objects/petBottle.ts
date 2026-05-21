/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const petBottle = defineObject({
	id: 'petBottle',
	name: 'PET Bottle',
	options: {
		schema: {
			withCap: {
				type: 'boolean',
				label: 'With Cap',
			},
			empty: {
				type: 'boolean',
				label: 'Empty',
			},
		},
		default: {
			withCap: true,
			empty: false,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: ({ model, options }) => {
		const capMesh = model.findMesh('__X_CAP__');
		const liquidMesh = model.findMesh('__X_LIQUID__');
		const labelMaterial = model.findMaterial('__X_LABEL__');

		labelMaterial.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHATEST;
		labelMaterial.alphaCutOff = 0.5;

		const applyWithCap = () => {
			capMesh.isVisible = options.withCap;
		};

		const applyEmpty = () => {
			liquidMesh.isVisible = !options.empty;
		};

		applyWithCap();
		applyEmpty();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyWithCap();
				applyEmpty();
			},
			interactions: {},
		};
	},
});
