/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';

export const name = 'perUserNotes';

export const schema = {
	'total': { accumulate: true },
	'inc': { range: 'small' },
	'dec': { range: 'small' },
	'diffs.normal': { range: 'small' },
	'diffs.reply': { range: 'small' },
	'diffs.renote': { range: 'small' },
	'diffs.withFile': { range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
