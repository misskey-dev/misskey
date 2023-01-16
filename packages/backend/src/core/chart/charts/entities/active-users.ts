import Chart from '../../core.js';

export const name = 'activeUsers';

export const schema = {
	'readWrite': { intersection: ['read', 'write'], range: 'small' },
	'read': { uniqueIncrement: true, range: 'small' },
	'write': { uniqueIncrement: true, range: 'small' },
	'registeredWithinWeek': { uniqueIncrement: true, range: 'small' },
	'registeredWithinMonth': { uniqueIncrement: true, range: 'small' },
	'registeredWithinYear': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideWeek': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideMonth': { uniqueIncrement: true, range: 'small' },
	'registeredOutsideYear': { uniqueIncrement: true, range: 'small' },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
