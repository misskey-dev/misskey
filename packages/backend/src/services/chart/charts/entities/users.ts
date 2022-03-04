import Chart from '../../core.js';

export const name = 'users';

export const schema = {
	'local.total': { accumulate: true },
	'local.inc': { range: 'small' },
	'local.dec': { range: 'small' },
	'remote.total': { accumulate: true },
	'remote.inc': { range: 'small' },
	'remote.dec': { range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
