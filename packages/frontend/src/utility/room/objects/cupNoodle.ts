/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';
import { cm, yuge } from '../utility.js';

export const cupNoodle = defineObject({
	id: 'cupNoodle',
	name: 'Cup Noodle',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	noCollisions: true,
	createInstance: ({ scene, root }) => {
		let yugeDispose: (() => void) | null = null;

		return {
			onInited: () => {
				yugeDispose = yuge(scene, root, new BABYLON.Vector3(0, cm(10), 0));
			},
			interactions: {},
			dispose: () => {
				yugeDispose?.();
			},
		};
	},
});
