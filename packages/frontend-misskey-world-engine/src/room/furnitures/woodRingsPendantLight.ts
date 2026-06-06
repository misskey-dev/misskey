/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFuniture } from '../furniture.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { cm, remap, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { woodRingsPendantLight_schema } from 'misskey-world/src/room/furnitures/woodRingsPendantLight.schema.js';

export const woodRingsPendantLight = defineFuniture(woodRingsPendantLight_schema, {
	createInstance: ({ lc, scene, options, model, graphicsQuality }) => {
		const shadeMaterial = model.findMaterial('__X_SHADE__');

		const applyShadeMat = () => {
			shadeMaterial.albedoColor = new BABYLON.Color3(options.shadeMat.color[0], options.shadeMat.color[1], options.shadeMat.color[2]);
			shadeMaterial.roughness = options.shadeMat.roughness;
			shadeMaterial.metallic = options.shadeMat.metallic;
		};

		applyShadeMat();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const lamp = model.findMesh('__X_LAMP__');
		const light = new BABYLON.PointLight('', new BABYLON.Vector3(0, 0, 0), scene, lc != null);
		light.parent = lamp;
		light.radius = cm(5);
		if (lc != null) lc.addLight(light);

		//const lensFlareSystem = new BABYLON.LensFlareSystem('lensFlareSystem', light, scene);
		//const flare00 = new BABYLON.LensFlare(0.1, 1.7, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare01 = new BABYLON.LensFlare(0.075, 0.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare02 = new BABYLON.LensFlare(0.05, -0.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare03 = new BABYLON.LensFlare(0.15, -1.5, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);
		//const flare04 = new BABYLON.LensFlare(0.3, -2, new BABYLON.Color3(...options.lightColor), '/client-assets/world/lensflare.png', lensFlareSystem);

		const applyLight = () => {
			const [r, g, b] = options.light.color;
			light.diffuse = new BABYLON.Color3(r, g, b);
			light.intensity = 2 * options.light.brightness * WORLD_SCALE * WORLD_SCALE;
			light.range = cm(200) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
			const emissive = lamp.material as BABYLON.PBRMaterial;
			emissive.emissiveColor = new BABYLON.Color3(r, g, b);
			emissive.emissiveIntensity = options.light.brightness * 20;
		};

		applyLight();

		const mainNode = model.findTransformNode('__X_MAIN__');
		const codeMesh = model.findMesh('__X_CODE__');

		const applyLength = () => {
			mainNode.position.y = -remap(options.length, 0, 1, 0, cm(200)) / WORLD_SCALE;
			codeMesh.morphTargetManager!.getTargetByName('Length')!.influence = options.length;
			model.updated();
		};

		applyLength();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shadeMat': applyShadeMat(); break;
					case 'bodyMat': applyBodyMat(); break;
					case 'light': applyLight(); break;
					case 'length': applyLength(); break;
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
