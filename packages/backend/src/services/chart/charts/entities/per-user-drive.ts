import Chart from '../../core';

export const name = 'perUserDrive';

export const schema = {
	'totalCount': { accumulate: true },
	'totalSize': { accumulate: true },
	'incCount': { range: 'small' },
	'incSize': {},
	'decCount': { range: 'small' },
	'decSize': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
