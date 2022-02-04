import Chart from '../../core';

export const name = 'perUserDrive';

export const schema = {
	'totalCount': { accumulate: true },
	'totalSize': { accumulate: true },
	'incCount': {},
	'incSize': {},
	'decCount': {},
	'decSize': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
