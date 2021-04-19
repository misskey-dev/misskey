export const packedQueueCountSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		waiting: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		active: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		completed: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		failed: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		delayed: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		},
		paused: {
			type: 'number' as const,
			optional: false as const, nullable: false as const
		}
	}
};
