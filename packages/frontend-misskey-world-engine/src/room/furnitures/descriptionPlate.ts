/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurniture } from '../furniture.js';
import { descriptionPlate_schema } from 'misskey-world/src/room/furnitures/descriptionPlate.schema.js';

export const descriptionPlate = defineFurniture(descriptionPlate_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
