/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { mixer_schema } from 'misskey-world/src/room/objects/mixer.schema.js';

export const mixer = defineFuniture(mixer_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
