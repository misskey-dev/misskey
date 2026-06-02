/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { defineFuniture } from '../furniture.js';
import { cm, WORLD_SCALE } from 'misskey-world/src/utility.js';
import { getLightRangeFactorByGraphicsQuality } from '../utility.js';
import { beamLamp_schema } from 'misskey-world/src/room/furnitures/beamLamp.schema.js';

export const beamLamp = defineFuniture(beamLamp_schema, {
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
