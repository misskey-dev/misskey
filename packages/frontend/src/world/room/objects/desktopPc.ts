/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

export const desktopPc = defineObject({
	id: 'desktopPc',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
			},
			coverMat: {
				type: 'material',
			},
			inner1Mat: {
				type: 'material',
			},
			inner2Mat: {
				type: 'material',
			},
			inner3Mat: {
				type: 'material',
			},
			ledColor: {
				type: 'color',
			},
		},
		default: {
			bodyMat: { color: [0.05, 0.05, 0.05], roughness: 0.5, metallic: 0.25 },
			coverMat: { color: [0.85, 0.85, 0.85], roughness: 0.2, metallic: 0 },
			inner1Mat: { color: [1, 1, 1], roughness: 0.2, metallic: 0 },
			inner2Mat: { color: [1, 1, 1], roughness: 0.2, metallic: 0 },
			inner3Mat: { color: [0.1, 0.1, 0.1], roughness: 0.4, metallic: 0.7 },
			ledColor: [0.5, 0.9, 0],
		},
	},
	placement: 'top',
	hasCollisions: true,
	canPreMeshesMerging: true,
	createInstance: ({ options, model, root, scene, lc, graphicsQuality }) => {
		// TODO: graphicsQualityがLOWならそもそも追加しない
		const light1 = new BABYLON.SpotLight('', new BABYLON.Vector3(0, cm(10), cm(22)), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, lc != null);
		light1.parent = root;
		light1.intensity = 0.05 * WORLD_SCALE * WORLD_SCALE;
		light1.range = cm(30) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		if (lc != null) lc.addLight(light1);

		const light2 = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(-5), cm(33), cm(-9)), new BABYLON.Vector3(1, 0, 0), Math.PI / 1, 2, scene, lc != null);
		light2.parent = root;
		light2.intensity = 0.05 * WORLD_SCALE * WORLD_SCALE;
		light2.range = cm(30) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		if (lc != null) lc.addLight(light2);

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const coverMaterial = model.findMaterial('__X_COVER__');
		const inner1Material = model.findMaterial('__X_INNER__');
		const inner2Material = model.findMaterial('__X_INNER2__');
		const inner3Material = model.findMaterial('__X_TUBE__');
		const ledMaterial = model.findMaterial('__X_LED__');

		ledMaterial.emissiveIntensity = 1;

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const applyCoverMat = () => {
			coverMaterial.albedoColor = new BABYLON.Color3(options.coverMat.color[0], options.coverMat.color[1], options.coverMat.color[2]);
			coverMaterial.roughness = options.coverMat.roughness;
			coverMaterial.metallic = options.coverMat.metallic;
		};

		applyCoverMat();

		const applyInner1Mat = () => {
			inner1Material.albedoColor = new BABYLON.Color3(options.inner1Mat.color[0], options.inner1Mat.color[1], options.inner1Mat.color[2]);
			inner1Material.roughness = options.inner1Mat.roughness;
			inner1Material.metallic = options.inner1Mat.metallic;
		};

		applyInner1Mat();

		const applyInner2Mat = () => {
			inner2Material.albedoColor = new BABYLON.Color3(options.inner2Mat.color[0], options.inner2Mat.color[1], options.inner2Mat.color[2]);
			inner2Material.roughness = options.inner2Mat.roughness;
			inner2Material.metallic = options.inner2Mat.metallic;
		};

		applyInner2Mat();

		const applyInner3Mat = () => {
			inner3Material.albedoColor = new BABYLON.Color3(options.inner3Mat.color[0], options.inner3Mat.color[1], options.inner3Mat.color[2]);
			inner3Material.roughness = options.inner3Mat.roughness;
			inner3Material.metallic = options.inner3Mat.metallic;
		};

		applyInner3Mat();

		const applyLedColor = () => {
			const [r, g, b] = options.ledColor;
			ledMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
			light1.diffuse = new BABYLON.Color3(r, g, b);
			light2.diffuse = new BABYLON.Color3(r, g, b);
		};

		applyLedColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyMat();
				applyCoverMat();
				applyInner1Mat();
				applyInner2Mat();
				applyInner3Mat();
				applyLedColor();
			},
			interactions: {},
			dispose: () => {
				light1.dispose();
				light2.dispose();
				if (lc != null) {
					lc.removeLight(light1);
					lc.removeLight(light2);
				}
				scene.removeLight(light1); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？
				scene.removeLight(light2); // lc使用時はsceneには追加してないはずだが、これがないとクラッシュする babylonのバグ？
			},
		};
	},
});
