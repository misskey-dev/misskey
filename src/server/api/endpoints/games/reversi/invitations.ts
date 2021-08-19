import define from '../../../define';
import { ReversiMatchings } from '@/models/index';

export const meta = {
	tags: ['games'],

	requireCredential: true as const,

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
				createdAt: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'date-time'
				},
				parentId: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				parent: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User'
				},
				childId: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				child: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'User'
				}
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	// Find session
	const invitations = await ReversiMatchings.find({
		childId: user.id
	});

	return await Promise.all(invitations.map((i) => ReversiMatchings.pack(i, user)));
});
