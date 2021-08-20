import define from '../../../define';
import { listRelay } from '@/services/relay';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true as const,

	params: {
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				inbox: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'url'
				},
				status: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					default: 'requesting',
					enum: [
						'requesting',
						'accepted',
						'rejected'
					]
				}
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	return await listRelay();
});
