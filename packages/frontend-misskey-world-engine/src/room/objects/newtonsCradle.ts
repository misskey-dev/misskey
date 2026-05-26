/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { newtonsCradle_schema } from 'misskey-world/src/room/objects/newtonsCradle.schema.js';

export const newtonsCradle = defineObject(newtonsCradle_schema, {
	createInstance: ({ options, model }) => {
		const frameMaterial = model.findMaterial('__X_FRAME__');

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'frameMat': applyFrameMat(); break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
