export const packedPageSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		updatedAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		summary: {
			type: 'string',
			optional: false, nullable: true,
		},
		content: {
			type: 'array',
			optional: false, nullable: false,
		},
		variables: {
			type: 'array',
			optional: false, nullable: false,
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: false, nullable: false,
		},
	},
} as const;

export const packedPageLikeSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		page: {
			type: 'object',
			ref: 'Page',
			optional: false, nullable: false,
		},
	},
} as const;
