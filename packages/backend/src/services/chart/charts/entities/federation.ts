import Chart from '../../core';

export const name = 'federation';

export const schema = {
	'deliveredInstances': { uniqueIncrement: true, range: 'small' },
	'inboxInstances': { uniqueIncrement: true, range: 'small' },
	'stalled': { uniqueIncrement: true, range: 'small' },
	'sub': { accumulate: true, range: 'small' },
	'pub': { accumulate: true, range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
