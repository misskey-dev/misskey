/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';

const remap = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) => {
	return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
};

export const woodRingsPendantLight = defineObject({
	id: 'woodRingsPendantLight',
	name: 'woodRingsPendantLight',
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
			length: {
				type: 'range',
				label: 'Length',
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
			length: 0.2,
		},
	},
	placement: 'ceiling',
	hasCollisions: false,
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

		const lamp = model.findMesh('__X_LAMP__');
		const light = new BABYLON.PointLight('', new BABYLON.Vector3(0, 0, 0), scene, room?.lightContainer != null);
		light.parent = lamp;
		light.radius = cm(5);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		//const lensFlareSystem = new BABYLON.LensFlareSystem('lensFlareSystem', light, scene);
		//const flare00 = new BABYLON.LensFlare(0.1, 1.7, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare01 = new BABYLON.LensFlare(0.075, 0.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare02 = new BABYLON.LensFlare(0.05, -0.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare03 = new BABYLON.LensFlare(0.15, -1.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare04 = new BABYLON.LensFlare(0.3, -2, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);

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

		const mainNode = model.findTransformNode('__X_MAIN__');
		const codeMesh = model.findMesh('__X_CODE__');

		const applyLength = () => {
			mainNode.position.y = -remap(options.length, 0, 1, 0, 200) / WORLD_SCALE;
			codeMesh.morphTargetManager!.getTargetByName('Length')!.influence = options.length;
			model.updated();
		};

		applyLength();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shadeColor': applyShadeColor(); break;
					case 'bodyColor': applyBodyColor(); break;
					case 'lightColor': applyLightColor(); break;
					case 'lightBrightness': applyLightBrightness(); break;
					case 'length': applyLength(); break;
				}
			},
			interactions: {},
		};
	},
});
