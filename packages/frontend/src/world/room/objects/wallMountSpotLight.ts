/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';
import { wallMountSpotLight_schema } from './wallMountSpotLight.schema.js';

export const wallMountSpotLight = defineObject(wallMountSpotLight_schema, {
	createInstance: ({ lc, scene, options, model, graphicsQuality }) => {
		const bodyMesh = model.findMesh('__X_BODY__');
		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const lamp = model.findMesh('__X_LAMP__');
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, lc != null);
		light.parent = lamp;
		light.radius = cm(5);
		if (lc != null) lc.addLight(light);

		const applyLight = () => {
			const [r, g, b] = options.light.color;
			light.diffuse = new BABYLON.Color3(r, g, b);
			light.intensity = 1 * options.light.brightness * WORLD_SCALE * WORLD_SCALE;
			light.range = cm(200) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveColor = new BABYLON.Color3(r, g, b);
			emissive.emissiveIntensity = options.light.brightness * 20;
		};

		applyLight();

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
					case 'bodyMat': applyBodyMat(); break;
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
