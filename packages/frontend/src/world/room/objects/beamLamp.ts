/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, WORLD_SCALE } from '../../utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';

export const beamLamp = defineObject({
	id: 'beamLamp',
	name: 'Beam Lamp',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ lc, root, scene, graphicsQuality }) => {
		const light = new BABYLON.PointLight('beamLampLight', new BABYLON.Vector3(0, cm(10), 0), scene, lc != null);
		light.parent = root;
		light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
		light.intensity = 0.03 * WORLD_SCALE * WORLD_SCALE;
		light.range = cm(100) * getLightRangeFactorByGraphicsQuality(graphicsQuality);
		if (lc != null) lc.addLight(light);

		return {
			onInited: () => {
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
