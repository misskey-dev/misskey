/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const woodRingFloorLamp = defineObject({
	id: 'woodRingFloorLamp',
	name: 'Wood Ring Floor Lamp',
	options: {
		schema: {
			shadeColor: {
				type: 'color',
				label: 'Shade color',
			},
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
		},
		default: {
			shadeColor: [0.21, 0.04, 0],
			bodyColor: [0.05, 0.05, 0.05],
		},
	},
	placement: 'floor',
	createInstance: ({ room, scene, options, model }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeColor = () => {
			const [r, g, b] = options.shadeColor;
			shadeMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyShadeColor();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const lamps = model.findMeshes('__X_LAMP__');
		for (const lamp of lamps) {
			const light = new BABYLON.SpotLight('', new BABYLON.Vector3(0/*cm*/, 0/*cm*/, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, room?.lightContainer != null);
			light.parent = lamp;
			light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
			light.intensity = 5000;
			light.range = 100/*cm*/;
			if (room?.lightContainer != null) room.lightContainer.addLight(light);
		}

		return {
			onOptionsUpdated: ([k, v]) => {
				applyShadeColor();
				applyBodyColor();
			},
			interactions: {},
		};
	},
});
