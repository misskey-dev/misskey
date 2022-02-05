import Chart from '../../core';

export const name = 'federation';

export const schema = {
	'instance.total': { accumulate: true },
	'instance.inc': { range: 'small' },
	'instance.dec': { range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
