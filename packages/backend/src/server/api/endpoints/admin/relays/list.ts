import define from '../../../define';
import { listRelay } from '@/services/relay';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				inbox: {
					type: 'string',
					optional: false, nullable: false,
					format: 'url',
				},
				status: {
					type: 'string',
					optional: false, nullable: false,
					default: 'requesting',
					enum: [
						'requesting',
						'accepted',
						'rejected',
					],
				},
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	return await listRelay();
});
