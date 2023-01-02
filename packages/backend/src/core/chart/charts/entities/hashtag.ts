import Chart from '../../core.js';

export const name = 'hashtag';

export const schema = {
	'local.users': { uniqueIncrement: true },
	'remote.users': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
