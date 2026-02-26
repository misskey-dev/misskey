/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const allInOnePc = defineObject({
	id: 'allInOnePc',
	name: 'All-in-One PC',
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
		},
		default: {
			bodyColor: [1, 1, 1],
			bezelColor: [0, 0, 0],
		},
	},
	placement: 'top',
	createInstance: ({ room, options, findMaterial }) => {
		const bodyMaterial = findMaterial('__X_BODY__');
		const bezelMaterial = findMaterial('__X_BEZEL__');
		const screenMaterial = findMaterial('__X_SCREEN__');

		const tex = new BABYLON.Texture('http://syu-win.local:3000/files/b6cefaba-3093-4c57-a7f8-993dee62c6f7', room.scene, false, false);

		screenMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);
		screenMaterial.emissiveTexture = tex;
		screenMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
		screenMaterial.emissiveTexture.level = 0.5;

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

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyColor();
				applyBezelColor();
			},
			interactions: {},
		};
	},
});
