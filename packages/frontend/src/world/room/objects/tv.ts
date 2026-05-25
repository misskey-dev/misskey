/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { getLightRangeFactorByGraphicsQuality, initTv } from '../utility.js';
import { cm, WORLD_SCALE } from '@/world/utility.js';

export const tv = defineObject({
	id: 'tv',
	name: 'TV',
	options: {
		schema: {
			bodyMat: {
				type: 'material',
				label: 'Body material',
			},
			screenBrightness: {
				type: 'range',
				label: 'Screen brightness',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			bodyMat: { color: [0, 0, 0], roughness: 0.3, metallic: 0.5 },
			screenBrightness: 0.5,
		},
	},
	placement: 'top',
	hasCollisions: true,
	hasTexture: true,
	createInstance: ({ options, lc, model, scene, timer, graphicsQuality }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(30) / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, lc != null);
		light.parent = model.root;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = cm(200) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		light.radius = cm(40);
		if (lc != null) lc.addLight(light);

		const screenMesh = model.findMesh('__TV_SCREEN__');
		screenMesh.markVerticesDataAsUpdatable(BABYLON.VertexBuffer.UVKind, true);

		model.bakeExcludeMeshes = [screenMesh];

		const screenMaterial = model.findMaterial('__X_SCREEN__');

		const { dispose: disposeTv } = initTv(scene, screenMesh, timer);

		//const videoTexture = new BABYLON.VideoTexture('', 'http://syu-win.local:3000/files/97986924-b99e-4fe1-993d-9caf010cca59', room.scene, false, true); ;
		//screenMaterial.emissiveTexture = videoTexture;
		//videoTexture.video.muted = true;
		//videoTexture.video.volume = 0;
		//videoTexture.video.loop = true;

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveIntensity = b * 2;
			light.intensity = (7 * b) * WORLD_SCALE * WORLD_SCALE;
		};

		applyScreenBrightness();

		//const updateUv = createPlaneUvMapper(screenMesh);
		//const applyFit = () => {
		//	const tex = screenMaterial.emissiveTexture;
		//	if (tex == null) return;
		//	const srcAspect = 16 / 9;
		//	const targetAspect = 16 / 9;
		//	updateUv(srcAspect, targetAspect, 'cover');
		//	model.updated();
		//};
		//applyFit();

		const bodyMaterial = model.findMaterial('__X_BODY__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'screenBrightness': applyScreenBrightness(); break;
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
