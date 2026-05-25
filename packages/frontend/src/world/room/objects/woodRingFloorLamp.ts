/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';
import { i18n } from '@/i18n.js';

export const woodRingFloorLamp = defineObject({
	id: 'woodRingFloorLamp',
	name: i18n.ts._miRoom._objects.woodRingFloorLamp,
	options: {
		schema: {
			shadeMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._woodRingFloorLamp.shadeMat,
			},
			bodyMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._woodRingFloorLamp.bodyMat,
			},
			light: {
				type: 'light',
				label: i18n.ts._miRoom._objects._woodRingFloorLamp.light,
			},
		},
		default: {
			shadeMat: { color: [0.21, 0.04, 0], metallic: 0, roughness: 0.5 },
			bodyMat: { color: [0.05, 0.05, 0.05], metallic: 1, roughness: 0.5 },
			light: {
				color: [1, 0.5, 0.2],
				brightness: 0.5,
			},
		},
	},
	placement: 'floor',
	hasCollisions: true,
	createInstance: ({ lc, scene, options, model, graphicsQuality }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeMat = () => {
			shadeMaterial.albedoColor = new BABYLON.Color3(options.shadeMat.color[0], options.shadeMat.color[1], options.shadeMat.color[2]);
			shadeMaterial.metallic = options.shadeMat.metallic;
			shadeMaterial.roughness = options.shadeMat.roughness;
		};

		applyShadeMat();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.metallic = options.bodyMat.metallic;
			bodyMaterial.roughness = options.bodyMat.roughness;
		};

		applyBodyMat();

		const lamps = model.findMeshes('__X_LAMP__');
		const lights: BABYLON.SpotLight[] = [];
		for (const lamp of lamps) {
			const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, lc != null);
			light.parent = lamp;
			light.radius = cm(5);
			if (lc != null) lc.addLight(light);
			lights.push(light);
		}

		const applyLight = () => {
			for (const light of lights) {
				light.diffuse = new BABYLON.Color3(options.light.color[0], options.light.color[1], options.light.color[2]);
				light.intensity = 1 * options.light.brightness * WORLD_SCALE * WORLD_SCALE;
				light.range = cm(200) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
			}
			for (const lamp of lamps) {
				(lamp.material as BABYLON.PBRMaterial).emissiveColor = new BABYLON.Color3(options.light.color[0], options.light.color[1], options.light.color[2]);
				(lamp.material as BABYLON.PBRMaterial).emissiveIntensity = options.light.brightness * 10;
			}
		};

		applyLight();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shadeMat': applyShadeMat(); break;
					case 'bodyMat': applyBodyMat(); break;
					case 'light': applyLight(); break;
				}
			},
			interactions: {},
			dispose: () => {
				for (const light of lights) {
					light.dispose();
					if (lc != null) lc.removeLight(light);
					scene.removeLight(light); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？
				}
			},
		};
	},
});
