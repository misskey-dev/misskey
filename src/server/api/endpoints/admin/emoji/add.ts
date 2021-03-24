import $ from 'cafy';
import define from '../../../define';
import { Emojis, DriveFiles } from '../../../../../models';
import { genId } from '@/misc/gen-id';
import { getConnection } from 'typeorm';
import { insertModerationLog } from '../../../../../services/insert-moderation-log';
import { ApiError } from '../../../error';
import { ID } from '@/misc/cafy-id';
import rndstr from 'rndstr';
import { publishBroadcastStream } from '../../../../../services/stream';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を追加します。'
	},

	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.type(ID)
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'MO_SUCH_FILE',
			id: 'fc46b5a4-6b92-4c33-ac66-b806659bb5cf'
		}
	}
};

export default define(meta, async (ps, me) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) throw new ApiError(meta.errors.noSuchFile);

	const name = file.name.split('.')[0].match(/^[a-z0-9_]+$/) ? file.name.split('.')[0] : `_${rndstr('a-z0-9', 8)}_`;

	const emoji = await Emojis.save({
		id: genId(),
		updatedAt: new Date(),
		name: name,
		category: null,
		host: null,
		aliases: [],
		url: file.url,
		type: file.type,
	});

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(emoji.id)
	});

	insertModerationLog(me, 'addEmoji', {
		emojiId: emoji.id
	});

	return {
		id: emoji.id
	};
});
