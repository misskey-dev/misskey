/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { cm } from 'misskey-world/src/utility.js';
import { mug_schema } from 'misskey-world/src/room/objects/mug.schema.js';
import { defineAccessory } from '../accessory.js';
import { yuge } from '../utility.js';

export const mug = defineAccessory(mug_schema, {
	createInstance: ({ scene, root, sr }) => {
		const yugeDispose = yuge(scene, root, new BABYLON.Vector3(0, cm(5), 0), sr);

		return {
			dispose: () => {
				yugeDispose?.();
			},
		};
	},
});
