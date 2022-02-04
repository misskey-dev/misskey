import Chart from '../../core';

export const name = 'activeUsers';

export const schema = {
	'local.users': { uniqueIncrement: true },
	'remote.users': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
