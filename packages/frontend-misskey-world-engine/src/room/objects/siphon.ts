/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { siphon_schema } from 'misskey-world/src/room/objects/siphon.schema.js';

export const siphon = defineFuniture(siphon_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
