/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { yuge } from '../utility.js';

export const cupNoodle = defineObject({
	id: 'cupNoodle',
	name: 'Cup Noodle',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ room, root }) => {
		return {
			onInited: () => {
				yuge(room, root, new BABYLON.Vector3(0, 10/*cm*/, 0));
			},
			interactions: {},
		};
	},
});
