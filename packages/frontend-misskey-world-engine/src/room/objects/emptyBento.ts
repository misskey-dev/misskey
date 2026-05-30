/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { emptyBento_schema } from 'misskey-world/src/room/objects/emptyBento.schema.js';

export const emptyBento = defineFuniture(emptyBento_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
