import Chart from '../../core';

export const name = 'network';

export const schema = {
	'incomingRequests': {},
	'outgoingRequests': {},
	'totalTime': {},
	'incomingBytes': {},
	'outgoingBytes': {},
};

export const entity = Chart.schemaToEntity(name, schema);
