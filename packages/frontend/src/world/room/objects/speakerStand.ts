/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const speakerStand = defineObject({
	id: 'speakerStand',
	name: 'speakerStand',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			height: {
				type: 'range',
				label: 'height',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyColor: [0.2, 0.2, 0.2],
			height: 0.1,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: false,
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applySize = () => {
			for (const mesh of model.root.getChildMeshes()) {
				if (mesh.morphTargetManager != null && mesh.morphTargetManager.getTargetByName('Height') != null) {
					mesh.morphTargetManager.getTargetByName('Height').influence = options.height;
				}
			}
			model.updated();
		};

		applySize();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'height': applySize(); break;
				}
			},
			interactions: {},
		};
	},
});
