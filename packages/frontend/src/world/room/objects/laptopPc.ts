/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

export const laptopPc = defineObject({
	id: 'laptopPc',
	name: 'Laptop PC',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			bezelColor: {
				type: 'color',
				label: 'Bezel color',
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
				label: 'Image',
				presets: [],
			},
			openAngle: {
				type: 'range',
				label: 'Open',
				min: -Math.PI / 2,
				max: Math.PI / 2,
				step: 0.01,
			},
		},
		default: {
			bodyColor: [1, 1, 1],
			bezelColor: [0, 0, 0],
			screenBrightness: 0.5,
			image: { type: null },
			openAngle: 0,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ lc, sr, scene, options, model, graphicsQuality }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const screenMesh = model.findMesh('__X_SCREEN__');
		const hutaNode = model.findTransformNode('__X_HUTA__');

		// TODO: graphicsQualityがLOWならそもそも追加しない
		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(10) / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, lc != null);
		light.parent = hutaNode;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = cm(100) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		light.radius = cm(15);
		if (lc != null) lc.addLight(light);

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const bezelMaterial = model.findMaterial('__X_BEZEL__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');

		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);

		const textureManager = createTextureManager(screenMesh, () => 31 / 19, scene);

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveIntensity = b * 2;
			light.intensity = (2 * b) * WORLD_SCALE * WORLD_SCALE;
		};

		applyScreenBrightness();

		const applyImage = () => {
			screenMaterial.unfreeze();
			let url: string | null = null;
			if (options.image.type === '_custom_') {
				url = options.image.custom?.url ?? null;
			}
			return textureManager.change(url, options.image.fit).then((tex) => {
				screenMaterial.emissiveTexture = tex;
			});
		};

		await applyImage();

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		const applyBezelColor = () => {
			const [r, g, b] = options.bezelColor;
			bezelMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();
		applyBezelColor();

		const applyOpenAngle = () => {
			const angle = options.openAngle;
			hutaNode.rotationQuaternion = null;
			hutaNode.rotation.x = -angle;
			if (angle <= -Math.PI / 2) {
				light.intensity = 0;
			} else {
				light.intensity = (2 * options.screenBrightness) * WORLD_SCALE * WORLD_SCALE;
			}
			model.updated();
		};

		applyOpenAngle();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyColor': applyBodyColor(); break;
					case 'bezelColor': applyBezelColor(); break;
					case 'screenBrightness': applyScreenBrightness(); break;
					case 'image': applyImage(); break;
					case 'openAngle': applyOpenAngle(); break;
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
