import $ from 'cafy';
import define from '../../../define';
import { ID } from '../../../../../misc/cafy-id';
import { Emojis } from '../../../../../models';
import { getConnection } from 'typeorm';
import { insertModerationLog } from '../../../../../services/insert-moderation-log';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を削除します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		}
	}
};

export default define(meta, async (ps, me) => {
	const emoji = await Emojis.findOne(ps.id);

	if (emoji == null) throw new Error('emoji not found');

	await Emojis.delete(emoji.id);

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	insertModerationLog(me, 'removeEmoji', {
		emoji: emoji
	});
});
