import Chart from '../../core';

export const name = 'instance';

export const schema = {
	'requests.failed': {},
	'requests.succeeded': {},
	'requests.received': {},
	'notes.total': { accumulate: true },
	'notes.inc': {},
	'notes.dec': {},
	'notes.diffs.normal': {},
	'notes.diffs.reply': {},
	'notes.diffs.renote': {},
	'users.total': { accumulate: true },
	'users.inc': {},
	'users.dec': {},
	'following.total': { accumulate: true },
	'following.inc': {},
	'following.dec': {},
	'followers.total': { accumulate: true },
	'followers.inc': {},
	'followers.dec': {},
	'drive.totalFiles': { accumulate: true },
	'drive.incFiles': {},
	'drive.decFiles': {},
	'drive.incUsage': {},
	'drive.decUsage': {},
};

export const entity = Chart.schemaToEntity(name, schema, true);
