/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

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
			innerColor: {
				type: 'color',
				label: 'Inner color',
			},
			ledColor: {
				type: 'color',
				label: 'LED color',
			},
		},
		default: {
			bodyColor: [0.05, 0.05, 0.05],
			coverColor: [0.3, 0.7, 0],
			innerColor: [1, 1, 1],
			ledColor: [0.5, 0.9, 0],
		},
	},
	placement: 'top',
	createInstance: ({ options, model }) => {
		const bodyMaterial = model.findMaterial('__X_BODY__');
		const coverMaterial = model.findMaterial('__X_COVER__');
		const innerMaterial = model.findMaterial('__X_INNER__');
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

		const applyInnerColor = () => {
			const [r, g, b] = options.innerColor;
			innerMaterial.albedoColor = new BABYLON.Color3(r, g, b);
		};

		applyInnerColor();

		const applyLedColor = () => {
			const [r, g, b] = options.ledColor;
			ledMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLedColor();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyBodyColor();
				applyCoverColor();
				applyInnerColor();
				applyLedColor();
			},
			interactions: {},
		};
	},
});
