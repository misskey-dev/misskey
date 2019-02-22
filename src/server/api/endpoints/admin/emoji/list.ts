import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を取得します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		host: {
			validator: $.optional.nullable.str,
			default: null as any
		}
	}
};

export default define(meta, async (ps) => {
	const emojis = await Emoji.find({
		host: ps.host
	});

	return emojis.map(e => ({
		id: e._id,
		name: e.name,
		aliases: e.aliases,
		host: e.host,
		url: e.url
	}));
});
