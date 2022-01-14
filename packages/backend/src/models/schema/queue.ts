export const packedQueueCountSchema = {
	type: 'object',
	optional: false, nullable: false,
	properties: {
		waiting: {
			type: 'number',
			optional: false, nullable: false,
		},
		active: {
			type: 'number',
			optional: false, nullable: false,
		},
		completed: {
			type: 'number',
			optional: false, nullable: false,
		},
		failed: {
			type: 'number',
			optional: false, nullable: false,
		},
		delayed: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;
