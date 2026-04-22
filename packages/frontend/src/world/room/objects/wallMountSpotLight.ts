/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';

export const wallMountSpotLight = defineObject({
	id: 'wallMountSpotLight',
	name: 'wallMountSpotLight',
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
				step: 0.1,
			},
			angleH: {
				type: 'range',
				label: 'Horizontal angle',
				min: 0,
				max: 1,
				step: 0.1,
			},
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			lightColor: [1, 0.5, 0.2],
			lightBrightness: 0.5,
			angleV: 0.1,
			angleH: 0.5,
		},
	},
	placement: 'side',
	hasCollisions: false,
	canPreMeshesMerging: false,
	hasTexture: false,
	createInstance: ({ room, scene, options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const lamp = model.findMesh('__X_LAMP__');
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light.parent = lamp;
		light.radius = cm(5);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const applyLightColor = () => {
			const [r, g, b] = options.lightColor;
			light.diffuse = new BABYLON.Color3(r, g, b);
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLightColor();

		const applyLightBrightness = () => {
			light.intensity = 1 * options.lightBrightness * WORLD_SCALE * WORLD_SCALE;
			light.range = cm(200) * options.lightBrightness;
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveIntensity = options.lightBrightness * 10;
		};

		applyLightBrightness();

		const applyAngle = () => {
			bodyMesh.rotationQuaternion = null;
			bodyMesh.rotation = new BABYLON.Vector3(0, 0, 0);
			bodyMesh.addRotation(0, 0, options.angleH * Math.PI * 2 - Math.PI);
			bodyMesh.addRotation((1 - options.angleV) * Math.PI / 2 - (Math.PI / 2), 0, 0);
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
