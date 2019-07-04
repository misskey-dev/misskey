import $ from 'cafy';
import define from '../../../define';
import { ID } from '../../../../../misc/cafy-id';
import { Emojis } from '../../../../../models';
import { getConnection } from 'typeorm';

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

export default define(meta, async (ps) => {
	const emoji = await Emojis.findOne(ps.id);

	if (emoji == null) throw new Error('emoji not found');

	await Emojis.delete(emoji.id);

	await getConnection().queryResultCache!.remove(['meta_emojis']);
});
