/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { cm, remap, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { downlight_schema } from 'misskey-world/src/room/furnitures/downlight.schema.js';
import { defineFurniture } from '../furniture.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

export const downlight = defineFurniture(downlight_schema, {
	createInstance: ({ lc, scene, options, model, graphicsQuality }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const lightMaterial = model.findMaterial('__X_LIGHT__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const body = model.findMesh('__X_BODY__');
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(0), 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 1, 2, scene, lc != null);
		light.parent = body;
		light.radius = cm(8);
		if (lc != null) lc.addLight(light);

		const applyLight = () => {
			const [r, g, b] = options.light.color;
			light.diffuse = new BABYLON.Color3(r, g, b);
			light.intensity = 5 * options.light.brightness * WORLD_SCALE * WORLD_SCALE;
			light.range = remap(options.light.brightness, 0, 1, cm(200), cm(400)) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
			lightMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
			lightMaterial.emissiveIntensity = options.light.brightness * 100;
		};

		applyLight();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'light': applyLight(); break;
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
