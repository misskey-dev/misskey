/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../utility.js';

export const desktopPc = defineObject({
	id: 'desktopPc',
	name: 'Desktop PC',
	options: {
		schema: {
			bodyColor: {
				type: 'color',
				label: 'Body color',
			},
			coverColor: {
				type: 'color',
				label: 'Cover color',
			},
			inner1Color: {
				type: 'color',
				label: 'Inner color 1',
			},
			inner2Color: {
				type: 'color',
				label: 'Inner color 2',
			},
			inner3Color: {
				type: 'color',
				label: 'Inner color 3',
			},
			ledColor: {
				type: 'color',
				label: 'LED color',
			},
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			coverColor: [0.9, 0.9, 0.9],
			inner1Color: [1, 1, 1],
			inner2Color: [1, 1, 1],
			inner3Color: [0.1, 0.1, 0.1],
			ledColor: [0.5, 0.9, 0],
		},
	},
	placement: 'top',
	hasCollisions: true,
	canPreMeshesMerging: true,
	createInstance: ({ options, model, root, scene, room }) => {
		const light1 = new BABYLON.SpotLight('', new BABYLON.Vector3(0, cm(10), cm(22)), new BABYLON.Vector3(0, 0, 1), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light1.parent = root;
		light1.intensity = 0.05 * WORLD_SCALE * WORLD_SCALE;
		light1.range = cm(30);
		if (room?.lightContainer != null) room.lightContainer.addLight(light1);

		const light2 = new BABYLON.SpotLight('', new BABYLON.Vector3(cm(-5), cm(33), cm(-9)), new BABYLON.Vector3(1, 0, 0), Math.PI / 1, 2, scene, room?.lightContainer != null);
		light2.parent = root;
		light2.intensity = 0.05 * WORLD_SCALE * WORLD_SCALE;
		light2.range = cm(30);
		if (room?.lightContainer != null) room.lightContainer.addLight(light2);

		const bodyMaterial = model.findMaterial('__X_BODY__');
		const coverMaterial = model.findMaterial('__X_COVER__');
		const inner1Material = model.findMaterial('__X_INNER__');
		const inner2Material = model.findMaterial('__X_INNER2__');
		const inner3Material = model.findMaterial('__X_TUBE__');
		const ledMaterial = model.findMaterial('__X_LED__');

		ledMaterial.emissiveIntensity = 1;

		const applyBodyColor = () => {
			const [r, g, b] = options.bodyColor;
			bodyMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyBodyColor();

		const applyCoverColor = () => {
			const [r, g, b] = options.coverColor;
			coverMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyCoverColor();

		const applyInner1Color = () => {
			const [r, g, b] = options.inner1Color;
			inner1Material.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyInner1Color();

		const applyInner2Color = () => {
			const [r, g, b] = options.inner2Color;
			inner2Material.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyInner2Color();

		const applyInner3Color = () => {
			const [r, g, b] = options.inner3Color;
			inner3Material.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyInner3Color();

		const applyLedColor = () => {
			const [r, g, b] = options.ledColor;
			ledMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
			light1.diffuse = new BABYLON.Color3(r, g, b);
			light2.diffuse = new BABYLON.Color3(r, g, b);
		};

		applyLedColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyColor();
				applyCoverColor();
				applyInner1Color();
				applyInner2Color();
				applyInner3Color();
				applyLedColor();
			},
			interactions: {},
		};
	},
});
