/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE, createPlaneUvMapper } from '../../utility.js';

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
			customPicture: {
				type: 'image',
				label: 'Custom picture',
			},
			fit: {
				type: 'enum',
				label: 'Custom picture fit',
				enum: ['cover', 'contain', 'stretch'],
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
			screenBrightness: 0.35,
			customPicture: null,
			fit: 'cover',
			openAngle: 0,
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: async ({ room, scene, options, model }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const screenMesh = model.findMesh('__X_SCREEN__');
		const hutaNode = model.findTransformNode('__X_HUTA__');

		const light = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(0), cm(10) / Math.abs(scale.y), 0), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light.parent = hutaNode;
		light.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
		light.range = cm(100);
		light.radius = cm(15);
		if (room?.lightContainer != null) room.lightContainer.addLight(light);

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const bezelMaterial = model.findMaterial('__X_BEZEL__');
		const screenMaterial = model.findMaterial('__X_SCREEN__');

		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);

		const updateUv = createPlaneUvMapper(screenMesh);

		const applyFit = () => {
			const tex = screenMaterial.emissiveTexture;
			if (tex == null) return;

			const srcAspect = tex.getSize().width / tex.getSize().height;
			const targetAspect = 31 / 19;

			updateUv(srcAspect, targetAspect, options.fit);

			model.updated();
		};

		applyFit();

		const applyCustomPicture = () => new Promise<void>((resolve) => {
			// テクスチャの読み込みに失敗したときの救済
			// TODO: 丁寧な実装に直す
			setTimeout(() => {
				resolve();
			}, 10000);

			if (options.customPicture != null) {
				const tex = new BABYLON.Texture(options.customPicture, scene, false, false);
				tex.wrapU = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.wrapV = BABYLON.Texture.MIRROR_ADDRESSMODE;
				tex.level = 0.5;

				screenMaterial.unfreeze();
				screenMaterial.emissiveTexture = tex;

				tex.onLoadObservable.addOnce(() => {
					applyFit();
					resolve();
				});
			} else {
				screenMaterial.emissiveTexture = null;
				resolve();
			}
		});

		await applyCustomPicture();

		const applyScreenBrightness = () => {
			const b = options.screenBrightness;
			screenMaterial.emissiveColor = new BABYLON.Color3(b, b, b);
			light.intensity = (2 * b) * WORLD_SCALE * WORLD_SCALE;
		};

		applyScreenBrightness();

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
					case 'customPicture': applyCustomPicture(); break;
					case 'fit': applyFit(); break;
					case 'openAngle': applyOpenAngle(); break;
				}
			},
			interactions: {},
		};
	},
});
