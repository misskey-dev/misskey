import Chart from '../../core';

export const name = 'activeUsers';

export const schema = {
	'local.users': {},
	'remote.users': {},
};

export const entity = Chart.schemaToEntity(name, schema);
