export const packedAppSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
		},
		callbackUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
		},
		permission: {
			type: 'array' as const,
			optional: false as const, nullable: false as const,
			items: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
		},
		secret: {
			type: 'string' as const,
			optional: true as const, nullable: false as const,
		},
		isAuthorized: {
			type: 'boolean' as const,
			optional: true as const, nullable: false as const,
		},
	},
};
