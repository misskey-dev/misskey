/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject, WORLD_SCALE } from '../engine.js';

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
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const applyLightColor = () => {
			const [r, g, b] = options.lightColor;
			light.diffuse = new BABYLON.Color3(r, g, b);
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLightColor();

		const applyLightBrightness = () => {
			light.intensity = 10000 * options.lightBrightness;
			light.range = 200/*cm*/ * options.lightBrightness;
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
