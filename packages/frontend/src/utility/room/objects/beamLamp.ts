/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const beamLamp = defineObject({
	id: 'beamLamp',
	name: 'Beam Lamp',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ room, root, scene }) => {
		return {
			onInited: () => {
				const light = new BABYLON.PointLight('beamLampLight', new BABYLON.Vector3(0, 10/*cm*/, 0), scene, room?.lightContainer != null);
				light.parent = root;
				light.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
				light.intensity = 300;
				light.range = 100/*cm*/;
				if (room?.lightContainer != null) room.lightContainer.addLight(light);
			},
			interactions: {},
		};
	},
});
