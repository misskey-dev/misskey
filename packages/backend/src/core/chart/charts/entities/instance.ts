/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';

export const name = 'instance';

export const schema = {
	'requests.failed': { range: 'small' },
	'requests.succeeded': { range: 'small' },
	'requests.received': { range: 'small' },
	'notes.total': { accumulate: true },
	'notes.inc': {},
	'notes.dec': {},
	'notes.diffs.normal': {},
	'notes.diffs.reply': {},
	'notes.diffs.renote': {},
	'notes.diffs.withFile': {},
	'users.total': { accumulate: true },
	'users.inc': { range: 'small' },
	'users.dec': { range: 'small' },
	'following.total': { accumulate: true },
	'following.inc': { range: 'small' },
	'following.dec': { range: 'small' },
	'followers.total': { accumulate: true },
	'followers.inc': { range: 'small' },
	'followers.dec': { range: 'small' },
	'drive.totalFiles': { accumulate: true },
	'drive.incFiles': {},
	'drive.decFiles': {},
	'drive.incUsage': {}, // in kilobyte
	'drive.decUsage': {}, // in kilobyte
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
