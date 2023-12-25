/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Chart from '../../core.js';

export const name = 'perUserPv';

export const schema = {
	'upv.user': { uniqueIncrement: true, range: 'small' },
	'pv.user': { range: 'small' },
	'upv.visitor': { uniqueIncrement: true, range: 'small' },
	'pv.visitor': { range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
