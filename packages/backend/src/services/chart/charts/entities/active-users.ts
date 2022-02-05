import Chart from '../../core';

export const name = 'activeUsers';

export const schema = {
	'users': { uniqueIncrement: true },
	'notedUsers': { uniqueIncrement: true, range: 'small' },
	'registeredWithinWeek': { uniqueIncrement: true, range: 'small' },
	'registeredWithinMonth': { uniqueIncrement: true, range: 'small' },
	'registeredWithinYear': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideWeek': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideMonth': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideYear': { uniqueIncrement: true, range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
