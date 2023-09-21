import Chart from '../../core.js';

export const name = 'activeUsers';

export const schema = {
	'readWrite': { intersection: ['read', 'write'] },
	'read': { uniqueIncrement: true },
	'write': { uniqueIncrement: true },
	'registeredWithinWeek': { uniqueIncrement: true },
	'registeredWithinMonth': { uniqueIncrement: true },
	'registeredWithinYear': { uniqueIncrement: true },
	'registeredOutsideWeek': { uniqueIncrement: true },
	'registeredOutsideMonth': { uniqueIncrement: true },
	'registeredOutsideYear': { uniqueIncrement: true },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
