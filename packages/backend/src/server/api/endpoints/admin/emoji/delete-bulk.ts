import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { Emojis } from '@/models/index';
import { getConnection, In } from 'typeorm';
import { insertModerationLog } from '@/services/insert-moderation-log';
import { ApiError } from '../../../error';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		ids: {
			validator: $.arr($.type(ID)),
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const emojis = await Emojis.find({
		id: In(ps.ids),
	});

	for (const emoji of emojis) {
		await Emojis.delete(emoji.id);
	
		await getConnection().queryResultCache!.remove(['meta_emojis']);
	
		insertModerationLog(me, 'deleteEmoji', {
			emoji: emoji,
		});
	}
});
