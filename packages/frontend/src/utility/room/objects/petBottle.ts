/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

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
	createInstance: ({ findMesh, options }) => {
		const capMesh = findMesh('__X_CAP__');
		const liquidMesh = findMesh('__X_LIQUID__');

		const applyWithCap = () => {
			capMesh.setEnabled(options.withCap);
		};

		const applyEmpty = () => {
			liquidMesh.setEnabled(!options.empty);
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
