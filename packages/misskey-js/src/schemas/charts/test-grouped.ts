export const name = 'testGrouped';

export const schema = {
	'foo.total': { accumulate: true },
	'foo.inc': {},
	'foo.dec': {},
} as const;
