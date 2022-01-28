import $ from 'cafy';
import define from '../../../define';
import { Emojis } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { getConnection } from 'typeorm';
import { ApiError } from '../../../error';
import { DriveFile } from '@/models/entities/drive-file';
import { ID } from '@/misc/cafy-id';
import { uploadFromUrl } from '@/services/drive/upload-from-url';
import { publishBroadcastStream } from '@/services/stream';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		emojiId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchEmoji: {
			message: 'No such emoji.',
			code: 'NO_SUCH_EMOJI',
			id: 'e2785b66-dca3-4087-9cac-b93c541cc425',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const emoji = await Emojis.findOne(ps.emojiId);

	if (emoji == null) {
		throw new ApiError(meta.errors.noSuchEmoji);
	}

	let driveFile: DriveFile;

	try {
		// Create file
		driveFile = await uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
	} catch (e) {
		throw new ApiError();
	}

	const copied = await Emojis.insert({
		id: genId(),
		updatedAt: new Date(),
		name: emoji.name,
		host: null,
		aliases: [],
		originalUrl: driveFile.url,
		publicUrl: driveFile.webpublicUrl ?? driveFile.url,
		type: driveFile.webpublicType ?? driveFile.type,
	}).then(x => Emojis.findOneOrFail(x.identifiers[0]));

	await getConnection().queryResultCache!.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(copied.id),
	});

	return {
		id: copied.id,
	};
});
