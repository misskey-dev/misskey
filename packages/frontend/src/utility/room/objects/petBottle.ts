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
	createInstance: ({ root, options }) => {
		const capMesh = root.getChildMeshes().find(m => m.name.includes('__X_CAP__')) as BABYLON.Mesh;
		const liquidMesh = root.getChildMeshes().find(m => m.name.includes('__X_LIQUID__')) as BABYLON.Mesh;

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
