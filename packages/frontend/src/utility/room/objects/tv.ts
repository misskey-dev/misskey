/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { initTv } from '../utility.js';

export const tv = defineObject({
	id: 'tv',
	name: 'TV',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			screenBrightness: {
				type: 'range',
				label: 'Screen brightness',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyColor: [0, 0, 0],
			screenBrightness: 0.5,
		},
	},
	placement: 'top',
	createInstance: ({ options, room, model, scene }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(0/*cm*/, 30/*cm*/ / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light.parent = model.root;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = 150/*cm*/;
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const screenMesh = model.findMesh('__TV_SCREEN__');
		screenMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		model.bakeExcludeMeshes = [screenMesh];

		const { material: screenMaterial } = initTv(room, screenMesh);

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveColor = new BABYLON.Color3(b, b, b);
			light.intensity = 70000 * b;
		};

		applyScreenBrightness();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'screenBrightness': applyScreenBrightness(); break;
				}
			},
			interactions: {},
		};
	},
});
