/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { facialTissue_schema } from 'misskey-world/src/room/objects/facialTissue.schema.js';

export const facialTissue = defineObject(facialTissue_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
