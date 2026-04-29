/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm } from '../../utility.js';
import { yuge } from '../utility.js';

export const mug = defineObject({
	id: 'mug',
	name: 'Mug',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	canPreMeshesMerging: true,
	createInstance: ({ scene, root }) => {
		let yugeDispose: (() => void) | null = null;

		return {
			onInited: () => {
				yugeDispose = yuge(scene, root, new BABYLON.Vector3(0, cm(5), 0));
			},
			interactions: {},
			dispose: () => {
				yugeDispose?.();
			},
		};
	},
});
