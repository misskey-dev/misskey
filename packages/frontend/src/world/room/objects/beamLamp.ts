/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject, WORLD_SCALE } from '../engine.js';
import { cm } from '../utility.js';

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
	createInstance: ({ room, root, scene }) => {
		return {
			onInited: () => {
				const light = new BABYLON.PointLight('beamLampLight', new BABYLON.Vector3(0, cm(10), 0), scene, room?.lightContainer != null);
				light.parent = root;
				light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
				light.intensity = 0.03 * WORLD_SCALE * WORLD_SCALE;
				light.range = cm(100);
				if (room?.lightContainer != null) room.lightContainer.addLight(light);
			},
			interactions: {},
		};
	},
});
