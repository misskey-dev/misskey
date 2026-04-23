/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, remap, WORLD_SCALE } from '@/world/utility.js';

export const ductRailSpotLights = defineObject({
	id: 'ductRailSpotLights',
	name: 'ductRailSpotLights',
	options: {
		schema: {
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
			angleV: {
				type: 'range',
				label: 'Vertical angle',
				min: 0,
				max: 1,
				step: 0.01,
			},
			angleH: {
				type: 'range',
				label: 'Horizontal angle',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			lightColor: [1, 0.5, 0.2],
			lightBrightness: 0.5,
			angleV: 0.75,
			angleH: 0.5,
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
	createInstance: ({ room, scene, options, model }) => {
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
			light.radius = cm(5);
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

		const shades = model.findMeshes('__X_SHADE__');

		const applyAngle = () => {
			for (const shade of shades) {
				shade.rotationQuaternion = null;
				shade.rotation = new BABYLON.Vector3(0, 0, 0);
				shade.addRotation(remap(options.angleV, 0, 1, Math.PI / 2, -Math.PI / 2), 0, 0);
				shade.addRotation(0, 0, remap(options.angleH, 0, 1, -Math.PI / 2, Math.PI / 2));
			}
			model.updated();
		};

		applyAngle();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'lightColor': applyLightColor(); break;
					case 'lightBrightness': applyLightBrightness(); break;
					case 'angleV':
					case 'angleH':
						applyAngle();
						break;
				}
			},
			interactions: {},
		};
	},
});
