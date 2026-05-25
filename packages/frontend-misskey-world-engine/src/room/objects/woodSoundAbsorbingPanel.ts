/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { woodSoundAbsorbingPanel_schema } from './woodSoundAbsorbingPanel.schema.js';

export const woodSoundAbsorbingPanel = defineObject(woodSoundAbsorbingPanel_schema, {
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
