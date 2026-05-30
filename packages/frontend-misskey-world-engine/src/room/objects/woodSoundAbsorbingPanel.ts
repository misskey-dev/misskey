/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFuniture } from '../object.js';
import { woodSoundAbsorbingPanel_schema } from 'misskey-world/src/room/objects/woodSoundAbsorbingPanel.schema.js';

export const woodSoundAbsorbingPanel = defineFuniture(woodSoundAbsorbingPanel_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
