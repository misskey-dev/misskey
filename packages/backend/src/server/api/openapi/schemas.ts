import { refs } from 'misskey-js/built/schemas.js';

export const schemas = {
	Error: {
		type: 'object',
		properties: {
			error: {
				type: 'object',
				description: 'An error object.',
				properties: {
					code: {
						type: 'string',
						description: 'An error code. Unique within the endpoint.',
					},
					message: {
						type: 'string',
						description: 'An error message.',
					},
					id: {
						type: 'string',
						format: 'uuid',
						description: 'An error ID. This ID is static.',
					},
				},
				required: ['code', 'id', 'message'],
			},
		},
		required: ['error'],
	},

	...refs,
};
