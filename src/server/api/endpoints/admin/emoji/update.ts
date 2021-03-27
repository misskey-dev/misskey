import $ from 'cafy';
import define from '../../../define';
import { ID } from '@/misc/cafy-id';
import { Emojis } from '../../../../../models';
import { getConnection } from 'typeorm';
import { ApiError } from '../../../error';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を更新します。'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		id: {
			validator: $.type(ID)
		},

		name: {
			validator: $.str
		},

		category: {
			validator: $.optional.nullable.str
		},

		aliases: {
			validator: $.arr($.str)
		}
	},

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: '684dec9d-a8c2-4364-9aa8-456c49cb1dc8'
		}
	}
};

export default define(meta, async (ps) => {
	const emoji = await Emojis.findOne(ps.id);

	if (emoji == null) throw new ApiError(meta.errors.noSuchEmoji);

	await Emojis.update(emoji.id, {
		updatedAt: new Date(),
		name: ps.name,
		category: ps.category,
		aliases: ps.aliases,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);
});
