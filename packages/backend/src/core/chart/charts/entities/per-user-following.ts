import Chart from '../../core.js';

export const name = 'perUserFollowing';

export const schema = {
	'local.followings.total': { accumulate: true },
	'local.followings.inc': { range: 'small' },
	'local.followings.dec': { range: 'small' },
	'local.followers.total': { accumulate: true },
	'local.followers.inc': { range: 'small' },
	'local.followers.dec': { range: 'small' },
	'remote.followings.total': { accumulate: true },
	'remote.followings.inc': { range: 'small' },
	'remote.followings.dec': { range: 'small' },
	'remote.followers.total': { accumulate: true },
	'remote.followers.inc': { range: 'small' },
	'remote.followers.dec': { range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema, true);
