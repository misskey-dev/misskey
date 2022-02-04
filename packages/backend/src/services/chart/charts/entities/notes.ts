import Chart from '../../core';

export const name = 'notes';

export const schema = {
	'local.total': { accumulate: true },
	'local.inc': {},
	'local.dec': {},
	'local.diffs.normal': {},
	'local.diffs.reply': {},
	'local.diffs.renote': {},
	'remote.total': { accumulate: true },
	'remote.inc': {},
	'remote.dec': {},
	'remote.diffs.normal': {},
	'remote.diffs.reply': {},
	'remote.diffs.renote': {},
};

export const entity = Chart.schemaToEntity(name, schema);
