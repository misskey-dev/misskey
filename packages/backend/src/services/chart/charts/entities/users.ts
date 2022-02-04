import Chart from '../../core';

export const name = 'users';

export const schema = {
	'local.total': { accumulate: true },
	'local.inc': {},
	'local.dec': {},
	'remote.total': { accumulate: true },
	'remote.inc': {},
	'remote.dec': {},
};

export const entity = Chart.schemaToEntity(name, schema);
