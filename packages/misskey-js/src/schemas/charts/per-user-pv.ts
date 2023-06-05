export const name = 'perUserPv';

export const schema = {
	'upv.user': { uniqueIncrement: true, range: 'small' },
	'pv.user': { range: 'small' },
	'upv.visitor': { uniqueIncrement: true, range: 'small' },
	'pv.visitor': { range: 'small' },
} as const;
