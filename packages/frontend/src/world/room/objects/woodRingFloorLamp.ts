/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';

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
			lightColor: {
				type: 'color',
				label: 'Light color',
			},
			lightBrightness: {
				type: 'range',
				label: 'Light brightness',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			shadeColor: [0.21, 0.04, 0],
			bodyColor: [0.05, 0.05, 0.05],
			lightColor: [1, 0.5, 0.2],
			lightBrightness: 0.5,
		},
	},
	placement: 'floor',
	hasCollisions: true,
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
		const lights: BABYLON.SpotLight[] = [];
		for (const lamp of lamps) {
			const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, room?.lightContainer != null);
			light.parent = lamp;
			if (room?.lightContainer != null) room.lightContainer.addLight(light);
			lights.push(light);
		}

		const applyLightColor = () => {
			const [r, g, b] = options.lightColor;
			for (const light of lights) {
				light.diffuse = new BABYLON.Color3(r, g, b);
			}
			for (const lamp of lamps) {
				const emissive = lamp.material as BABYLON.PBRMaterial;
				emissive.emissiveColor = new BABYLON.Color3(r, g, b);
			}
		};

		applyLightColor();

		const applyLightBrightness = () => {
			for (const light of lights) {
				light.intensity = 1 * options.lightBrightness * WORLD_SCALE * WORLD_SCALE;
				light.range = cm(200) * options.lightBrightness;
			}
			for (const lamp of lamps) {
				const emissive = lamp.material as BABYLON.PBRMaterial;
				emissive.emissiveIntensity = options.lightBrightness * 10;
			}
		};

		applyLightBrightness();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyShadeColor();
				applyBodyColor();
				applyLightColor();
				applyLightBrightness();
			},
			interactions: {},
		};
	},
});
