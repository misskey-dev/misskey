/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { yuge } from '../utility.js';

export const mug = defineObject({
	id: 'mug',
	name: 'Mug',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ scene, root }) => {
		return {
			onInited: () => {
				yuge(scene, root, new BABYLON.Vector3(0, 5/*cm*/, 0));
			},
			interactions: {},
		};
	},
});
