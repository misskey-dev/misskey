import $ from 'cafy';
import define from '../../../define';
import { detectUrlMime } from '../../../../../misc/detect-url-mime';
import { Emojis } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { getConnection } from 'typeorm';
import { insertModerationLog } from '../../../../../services/insert-moderation-log';
import { ApiError } from '../../../error';

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

		category: {
			validator: $.optional.str
		},

		aliases: {
			validator: $.optional.arr($.str.min(1)),
			default: [] as string[]
		}
	},

	errors: {
		emojiAlredyExists: {
			message: 'Emoji already exists.',
			code: 'EMOJI_ALREADY_EXISTS',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf'
		}
	}
};

export default define(meta, async (ps, me) => {
	const type = await detectUrlMime(ps.url);

	const exists = await Emojis.findOne({
		name: ps.name,
		host: null
	});

	if (exists != null) throw new ApiError(meta.errors.emojiAlredyExists);

	const emoji = await Emojis.save({
		id: genId(),
		updatedAt: new Date(),
		name: ps.name,
		category: ps.category,
		host: null,
		aliases: ps.aliases,
		url: ps.url,
		type,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	insertModerationLog(me, 'addEmoji', {
		emojiId: emoji.id
	});

	return {
		id: emoji.id
	};
});
