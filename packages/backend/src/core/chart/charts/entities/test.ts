import Chart from '../../core.js';

export const name = 'test';

export const schema = {
	'foo.total': { accumulate: true },
	'foo.inc': {},
	'foo.dec': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema);
