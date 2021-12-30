import Chart from '../../core';

export const name = 'perUserReaction';

const logSchema = {
	/**
	 * 被リアクション数
	 */
	count: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},
};

export const schema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		local: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema,
		},
		remote: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: logSchema,
		},
	},
};

export const entity = Chart.schemaToEntity(name, schema, true);
