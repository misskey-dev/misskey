/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { rolledUpPoster_schema } from './rolledUpPoster.schema.js';

export const rolledUpPoster = defineObject(rolledUpPoster_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
