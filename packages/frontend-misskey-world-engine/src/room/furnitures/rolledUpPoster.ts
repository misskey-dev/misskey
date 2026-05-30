/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { rolledUpPoster_schema } from 'misskey-world/src/room/furnitures/rolledUpPoster.schema.js';

export const rolledUpPoster = defineFuniture(rolledUpPoster_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
