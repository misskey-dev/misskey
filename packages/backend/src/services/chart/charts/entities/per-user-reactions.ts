import Chart from '../../core';

export const name = 'perUserReaction';

export const schema = {
	'local.count': {},
	'remote.count': {},
};

export const entity = Chart.schemaToEntity(name, schema, true);
