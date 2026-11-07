/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';

export const name = 'apRequest';

export const schema = {
	'deliverFailed': { },
	'deliverSucceeded': { },
	'inboxReceived': { },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
