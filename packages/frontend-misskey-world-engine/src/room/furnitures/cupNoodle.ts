/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure.js';
import { defineFuniture } from '../furniture.js';
import { cm } from 'misskey-world/src/utility.js';
import { yuge } from '../utility.js';
import { cupNoodle_schema } from 'misskey-world/src/room/furnitures/cupNoodle.schema.js';

export const cupNoodle = defineFuniture(cupNoodle_schema, {
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
