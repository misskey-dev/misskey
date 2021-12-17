import Chart from '../../core';

export const name = 'network';

export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		incomingRequests: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		outgoingRequests: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		totalTime: { // TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		incomingBytes: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
		outgoingBytes: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
		},
	},
};

export const entity = Chart.schemaToEntity(name, schema);
