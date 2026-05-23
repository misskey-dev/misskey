/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { cm, remap, WORLD_SCALE } from '@/world/utility.js';

export const spotLight = defineObject({
	id: 'spotLight',
	name: 'spotLight',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			light: {
				type: 'light',
				label: 'Light',
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
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.2,
			},
			angleV: 0.75,
			angleH: 0.5,
		},
	},
	placement: 'bottom',
	hasCollisions: false,
	createInstance: ({ lc, scene, options, model, graphicsQuality }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const lamp = model.findMesh('__X_LAMP__');
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, lc != null);
		light.parent = lamp;
		light.radius = cm(8);
		if (lc != null) lc.addLight(light);

		const applyLight = () => {
			const [r, g, b] = options.light.color;
			light.diffuse = new BABYLON.Color3(r, g, b);
			light.intensity = 5 * options.light.brightness * WORLD_SCALE * WORLD_SCALE;
			light.range = remap(options.light.brightness, 0, 1, cm(200), cm(400)) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveColor = new BABYLON.Color3(r, g, b);
			emissive.emissiveIntensity = options.light.brightness * 100;
		};

		applyLight();

		const shade = model.findMesh('__X_SHADE__');

		const applyAngle = () => {
			shade.rotationQuaternion = null;
			shade.rotation = new BABYLON.Vector3(0, 0, 0);
			shade.addRotation(remap(options.angleV, 0, 1, Math.PI / 2, -Math.PI / 2), 0, 0);
			shade.addRotation(0, 0, remap(options.angleH, 0, 1, -Math.PI / 2, Math.PI / 2));
			model.updated();
		};

		applyAngle();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'light': applyLight(); break;
					case 'angleV':
					case 'angleH':
						applyAngle();
						break;
				}
			},
			interactions: {},
			dispose: () => {
				light.dispose();
				if (lc != null) lc.removeLight(light);
				scene.removeLight(light); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？
			},
		};
	},
});
