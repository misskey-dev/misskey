import $ from 'cafy';
import define from '../../../define';
import { detectUrlMine } from '../../../../../misc/detect-url-mine';
import { Emojis } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { getConnection } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を追加します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		name: {
			validator: $.str.min(1)
		},

		url: {
			validator: $.str.min(1)
		},

		aliases: {
			validator: $.optional.arr($.str.min(1)),
			default: [] as string[]
		}
	}
};

export default define(meta, async (ps) => {
	const type = await detectUrlMine(ps.url);

	const emoji = await Emojis.save({
		id: genId(),
		updatedAt: new Date(),
		name: ps.name,
		host: null,
		aliases: ps.aliases,
		url: ps.url,
		type,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	return {
		id: emoji.id
	};
});
