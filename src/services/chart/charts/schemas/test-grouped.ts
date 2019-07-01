export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		foo: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				total: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: ''
				},

				inc: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: ''
				},

				dec: {
					type: 'number' as const,
					optional: false as const, nullable: false as const,
					description: ''
				},
			}
		}
	}
};

export const name = 'testGrouped';
