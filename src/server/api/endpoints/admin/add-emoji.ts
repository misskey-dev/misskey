import $ from 'cafy';
import Emoji from '../../../../models/emoji';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を追加します。'
	},

	requireCredential: true,
	requireAdmin: true,

	params: {
		name: {
			validator: $.str
		},

		url: {
			validator: $.str
		},

		aliases: {
			validator: $.arr($.str).optional,
			default: [] as string[]
		}
	}
};

export default define(meta, (ps) => new Promise(async (res, rej) => {
	await Emoji.insert({
		name: ps.name,
		host: null,
		aliases: ps.aliases,
		url: ps.url
	});

	res();
}));
