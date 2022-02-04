import Chart from '../../core';

export const name = 'federation';

export const schema = {
	'instance.total': { accumulate: true },
	'instance.inc': {},
	'instance.dec': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema);
