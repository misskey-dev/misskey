import Chart from '../../core';

export const name = 'perUserFollowing';

export const schema = {
	'local.followings.total': { accumulate: true },
	'local.followings.inc': {},
	'local.followings.dec': {},
	'local.followers.total': { accumulate: true },
	'local.followers.inc': {},
	'local.followers.dec': {},
	'remote.followings.total': { accumulate: true },
	'remote.followings.inc': {},
	'remote.followings.dec': {},
	'remote.followers.total': { accumulate: true },
	'remote.followers.inc': {},
	'remote.followers.dec': {},
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
