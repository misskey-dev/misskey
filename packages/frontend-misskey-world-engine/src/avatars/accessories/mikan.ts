/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { mikan_schema } from 'misskey-world/src/avatars/accessories/mikan.schema.js';
import { defineAccessory } from '../accessory.js';

export const mikan = defineAccessory(mikan_schema, {
	createInstance: ({ scene, root, sr }) => {
		return {
			dispose: () => {
			},
		};
	},
});
