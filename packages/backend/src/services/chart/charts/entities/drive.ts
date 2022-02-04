import Chart from '../../core';

export const name = 'drive';

export const schema = {
	'local.incCount': {},
	'local.incSize': {},
	'local.decCount': {},
	'local.decSize': {},
	'remote.incCount': {},
	'remote.incSize': {},
	'remote.decCount': {},
	'remote.decSize': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema);
