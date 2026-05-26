/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm } from '../../../../../frontend-misskey-world-engine/src/utility.js';
import { yuge } from '../utility.js';
import { cupNoodle_schema } from 'misskey-world/src/room/objects/cupNoodle.schema.js';

export const cupNoodle = defineObject(cupNoodle_schema, {
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
