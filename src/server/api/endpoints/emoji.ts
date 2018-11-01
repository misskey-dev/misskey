import $ from 'cafy';
import Meta from '../../../models/meta';
import { ILocalUser } from '../../../models/user';
import getParams from '../get-params';
import { customEmojisPath } from '../mastodon';
import { IMastodonEmoji, toMisskeyEmojiSync } from '../../../models/mastodon/emoji';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'インスタンスの絵文字を取得します。',
		'en-US': 'Get the emojis of the instance.'
	},

	requireCredential: false,

	params: {
		instance: $.string.optional.match(/^([a-zA-Z0-9-]{2,63}\.)+[a-zA-Z0-9-]{2,63}$/).note({
			'ja-JP': 'インスタンスのホストドメイン名。省略するとこのインスタンスになります。'
		})
	},
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	let result;
	if (ps.instance) {
		const response = await fetch(`https://${ps.instance}/api/${customEmojisPath}`);
		const emojis = await response.json() as IMastodonEmoji[];

		result = emojis.map(toMisskeyEmojiSync);
	} else {
		const { emojis } = (await Meta.findOne()) || { emojis: [] };

		result = emojis;
	}
	res(result);
});
