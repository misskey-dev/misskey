export const name = 'test';

export const schema = {
	'foo.total': { accumulate: true },
	'foo.inc': {},
	'foo.dec': {},
} as const;
