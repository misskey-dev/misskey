/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const monitorSpeaker = defineObject({
	id: 'monitorSpeaker',
	name: 'Monitor Speaker',
	options: {
		schema: {
			color: {
				type: 'color',
				label: 'Color',
			},
		},
		default: {
			color: [0, 0, 0],
		},
	},
	placement: 'top',
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = bodyMesh.material as BABYLON.PBRMaterial;

		const applyColor = () => {
			const [r, g, b] = options.color;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyColor();
			},
			interactions: {},
		};
	},
});
