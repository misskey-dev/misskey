/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { openedCardboardBox_schema } from './openedCardboardBox.schema.js';

export const openedCardboardBox = defineObject(openedCardboardBox_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
