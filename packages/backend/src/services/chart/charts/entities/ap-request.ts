import Chart from '../../core';

export const name = 'apRequest';

export const schema = {
	'deliverFailed': { },
	'deliverSucceeded': { },
	'inboxReceived': { },
} as const;

export const entity = Chart.schemaToEntity(name, schema);
