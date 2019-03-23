import $ from 'cafy';
import define from '../../../define';
import { StringID } from '../../../../../misc/cafy-id';
import { Emojis } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を削除します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(StringID)
		}
	}
};

export default define(meta, async (ps) => {
	const emoji = await Emojis.findOne(ps.id);

	if (emoji == null) throw new Error('emoji not found');

	await Emojis.delete(emoji.id);
});
