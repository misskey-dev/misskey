import Chart from '../../core';

export const name = 'notes';

const logSchema = {
	total: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},

	inc: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},

	dec: {
		type: 'number' as const,
		optional: false as const, nullable: false as const,
	},

	diffs: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			normal: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},

			reply: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},

			renote: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
		},
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

export const entity = Chart.schemaToEntity(name, schema);
