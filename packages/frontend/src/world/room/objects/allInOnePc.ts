/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

export const allInOnePc = defineObject({
	id: 'allInOnePc',
	name: 'All-in-One PC',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: 'Body material',
			},
			bezelMat: {
				type: 'material',
				label: 'Bezel material',
			},
			screenBrightness: {
				type: 'range',
				label: 'Screen brightness',
				min: 0,
				max: 1,
				step: 0.01,
			},
			image: {
				type: 'image',
				label: 'Screen image',
				presets: [{
					label: 'Desktop',
					value: 'desktop',
				}],
			},
		},
		default: {
			bodyMat: { color: [1, 1, 1], roughness: 0.5, metallic: 1 },
			bezelMat: { color: [0, 0, 0], roughness: 0, metallic: 0 },
			screenBrightness: 0.5,
			image: {
				type: null,
			},
		},
	},
	placement: 'top',
	hasTexture: true,
	createInstance: async ({ lc, scene, options, model, graphicsQuality }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		// TODO: graphicsQualityがLOWならそもそも追加しない
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(30) / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, lc != null);
		light.parent = model.root;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = cm(100) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		light.radius = cm(20);
		if (lc != null) lc.addLight(light);

		const screenMesh = model.findMesh('__X_SCREEN__');

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const bezelMaterial = model.findMaterial('__X_BEZEL__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');

		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

		const textureManager = createTextureManager(screenMesh, () => 50 / 27.5, scene);

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveIntensity = b * 2;
			light.intensity = (5 * b) * WORLD_SCALE * WORLD_SCALE;
		};

		applyScreenBrightness();

		const applyImage = () => {
			screenMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			} else if (options.image.type === 'desktop') {
				url = '/assets/objects/all-in-one-pc/desktop.png';
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				screenMaterial.emissiveTexture = tex;
			});
		};

		await applyImage();

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		const applyBezelMat = () => {
			bezelMaterial.albedoColor = new BABYLON.Color3(options.bezelMat.color[0], options.bezelMat.color[1], options.bezelMat.color[2]);
			bezelMaterial.roughness = options.bezelMat.roughness;
			bezelMaterial.metallic = options.bezelMat.metallic;
		};

		applyBodyMat();
		applyBezelMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'bezelMat': applyBezelMat(); break;
					case 'screenBrightness': applyScreenBrightness(); break;
					case 'image': applyImage(); break;
				}
			},
			interactions: {},
			dispose: () => {
				light.dispose();
				if (lc != null) lc.removeLight(light);
				scene.removeLight(light); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？

				textureManager.dispose();
			},
		};
	},
});
