/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';

export const issyoubin = defineObject({
	id: 'issyoubin',
	name: 'issyoubin',
	options: {
		schema: {
		},
		default: {
		},
	},
	placement: 'top',
	hasCollisions: false,
	hasTexture: true,
	createInstance: ({ model, options }) => {
		return {
			onOptionsUpdated: ([k, v]) => {
			},
			interactions: {},
		};
	},
});
