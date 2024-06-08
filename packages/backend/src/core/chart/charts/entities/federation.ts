/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';

export const name = 'federation';

export const schema = {
	'deliveredInstances': { uniqueIncrement: true, range: 'small' },
	'inboxInstances': { uniqueIncrement: true, range: 'small' },
	'stalled': { uniqueIncrement: true, range: 'small' },
	'sub': { accumulate: true, range: 'small' },
	'pub': { accumulate: true, range: 'small' },
	'pubsub': { accumulate: true, range: 'small' },
	'subActive': { accumulate: true, range: 'small' },
	'pubActive': { accumulate: true, range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
