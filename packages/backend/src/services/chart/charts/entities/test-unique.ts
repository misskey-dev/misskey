import Chart from '../../core';

export const name = 'testUnique';

export const schema = {
	'foo': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
