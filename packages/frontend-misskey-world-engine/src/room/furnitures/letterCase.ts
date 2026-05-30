/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../furniture.js';
import { letterCase_schema } from 'misskey-world/src/room/furnitures/letterCase.schema.js';

export const letterCase = defineFuniture(letterCase_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
