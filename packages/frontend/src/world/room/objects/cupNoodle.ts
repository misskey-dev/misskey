/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm } from '../../utility.js';
import { yuge } from '../utility.js';
import { i18n } from '@/i18n.js';

export const cupNoodle = defineObject({
	id: 'cupNoodle',
	name: i18n.ts._miRoom._objects.cupNoodle,
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	canPreMeshesMerging: true,
	createInstance: ({ scene, root, sr }) => {
		let yugeDispose: (() => void) | null = null;

		return {
			onInited: () => {
				yugeDispose = yuge(scene, root, new BABYLON.Vector3(0, cm(10), 0), sr);
			},
			interactions: {},
			dispose: () => {
				yugeDispose?.();
			},
		};
	},
});
