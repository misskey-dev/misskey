/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { descriptionPlate_schema } from 'misskey-world/src/room/objects/descriptionPlate.schema.js';

export const descriptionPlate = defineFuniture(descriptionPlate_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
