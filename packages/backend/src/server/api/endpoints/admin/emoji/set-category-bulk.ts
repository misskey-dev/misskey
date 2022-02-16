import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { Emojis } from '@/models/index';
import { getConnection, In } from 'typeorm';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		type: 'object',
		properties: {
			ids: { type: 'array', items: {
				type: 'string', format: 'misskey:id',
			}, },
			category: { type: 'string', nullable: true, },
		},
		required: ['ids'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	await Emojis.update({
		id: In(ps.ids),
	}, {
		updatedAt: new Date(),
		category: ps.category,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);
});
