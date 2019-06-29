export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		foo: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: ''
		},
	}
};

export const name = 'testUnique';
