/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { djMixer_schema } from 'misskey-world/src/room/furnitures/djMixer.schema.js';

export const djMixer = defineFuniture(djMixer_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
