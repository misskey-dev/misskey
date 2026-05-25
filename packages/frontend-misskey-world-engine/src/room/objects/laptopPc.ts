/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { createTextureManager, defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../../../../frontend-misskey-world-engine/src/utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { laptopPc_schema } from './laptopPc.schema.js';

export const laptopPc = defineObject(laptopPc_schema, {
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
		screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
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
					case 'bodyMat': applyBodyMat(); break;
					case 'bezelMat': applyBezelMat(); break;
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
