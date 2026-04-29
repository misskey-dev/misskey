/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper, normalizeUvToSquare } from '../../utility.js';

export const monitor = defineObject({
	id: 'monitor',
	name: 'Monitor',
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
			customPicture: {
				type: 'image',
				label: 'Custom picture',
			},
			fit: {
				type: 'enum',
				label: 'Custom picture fit',
				enum: ['cover', 'contain', 'stretch'],
			},
		},
		default: {
			bodyColor: [0.1, 0.1, 0.1],
			screenBrightness: 0.35,
			customPicture: null,
			fit: 'cover',
		},
	},
	placement: 'top',
	hasTexture: true,
	createInstance: async ({ room, scene, options, model }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(20) / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light.parent = model.root;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = cm(100);
		light.radius = cm(20);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const screenMesh = model.findMesh('__X_SCREEN__');

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');

		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);

		normalizeUvToSquare(screenMesh);
		const updateUv = createPlaneUvMapper(screenMesh);

		const applyFit = () => {
			const tex = screenMaterial.emissiveTexture;
			if (tex == null) return;

			const srcAspect = tex.getSize().width / tex.getSize().height;
			const targetAspect = 16 / 9;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			if (options.customPicture != null) {
				screenMaterial.unfreeze();
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false, undefined, () => {
					screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
					screenMaterial.emissiveTexture = tex;
					applyFit();
					resolve();
				}, (message, exception) => {
					console.warn('Failed to load texture:', message, exception);
					screenMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
					screenMaterial.emissiveTexture = null;
					resolve();
				});
				tex.level = 0.5;
			} else {
				screenMaterial.emissiveTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveColor = new BABYLON.Color3(b, b, b);
			light.intensity = (5 * b) * WORLD_SCALE * WORLD_SCALE;
		};

		applyScreenBrightness();

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
					case 'customPicture': applyCustomPicture(); break;
					case 'fit': applyFit(); break;
				}
			},
			interactions: {},
		};
	},
});
