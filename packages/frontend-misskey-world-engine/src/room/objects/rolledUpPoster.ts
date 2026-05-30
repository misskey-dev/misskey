/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { rolledUpPoster_schema } from 'misskey-world/src/room/objects/rolledUpPoster.schema.js';

export const rolledUpPoster = defineFuniture(rolledUpPoster_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
