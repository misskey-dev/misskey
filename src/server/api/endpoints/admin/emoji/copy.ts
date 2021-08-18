import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '../../../../../models';
import { genId } from '@/misc/gen-id';
import { getConnection } from 'typeorm';
import { ApiError } from '../../../error';
import { DriveFile } from '../../../../../models/entities/drive-file';
import { ID } from '@/misc/cafy-id';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';
import { publishBroadcastStream } from '@/services/stream';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		emojiId: {
			validator: $.type(ID)
		},
	},

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'e2785b66-dca3-4087-9cac-b93c541cc425'
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			id: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			}
		}
	}
};

export default define(meta, async (ps, me) => {
	const emoji = await Emojis.findOne(ps.emojiId);

	if (emoji == null) {
		throw new ApiError(meta.errors.noSuchEmoji);
	}

	let driveFile: DriveFile;

	try {
		// Create file
		driveFile = await uploadFromUrl(emoji.url, null, null, null, false, true);
	} catch (e) {
		throw new ApiError();
	}

	const copied = await Emojis.insert({
		id: genId(),
		updatedAt: new Date(),
		name: emoji.name,
		host: null,
		aliases: [],
		url: driveFile.url,
		type: driveFile.type,
		fileId: driveFile.id,
	}).then(x => Emojis.findOneOrFail(x.identifiers[0]));

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(copied.id)
	});

	return {
		id: copied.id
	};
});
