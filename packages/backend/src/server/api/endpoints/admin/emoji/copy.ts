import { Emojis } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { uploadFromUrl } from '@/services/drive/upload-from-url.js';
import { publishBroadcastStream } from '@/services/stream.js';
import { db } from '@/db/postgre.js';
import { ApiError } from '../../../error.js';
import define from '../../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

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

export const paramDef = {
	type: 'object',
	properties: {
		emojiId: { type: 'string', format: 'misskey:id' },
	},
	required: ['emojiId'],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	const emoji = await Emojis.findOneBy({ id: ps.emojiId });

	console.debug('[copy.ts] emoji =', emoji);

	if (emoji == null) {
		throw new ApiError(meta.errors.noSuchEmoji);
	}

	let driveFile: DriveFile;

	try {
		// Create file
		console.debug('[copy.ts] emoji.originalUrl =', emoji.originalUrl);
		driveFile = await uploadFromUrl({ url: emoji.originalUrl, user: null, force: true });
	} catch (e: unknown) {
		console.debug('[copy.ts] e =', e);
		throw new ApiError({
			message: e instanceof Error ? e.message : 'Failed to upload emoji.',
			code: 'FAILED_TO_UPLOAD_EMOJI',
			id:	'3c85c5a8-f98b-48ad-9f44-e70a685246ef',
			kind: 'server',
			httpStatusCode: 500,
		});
	}

	console.debug('driveFile =', driveFile);

	const copied = await Emojis.insert({
		id: genId(),
		updatedAt: new Date(),
		name: emoji.name,
		host: null,
		aliases: [],
		originalUrl: driveFile.url,
		publicUrl: driveFile.webpublicUrl ?? driveFile.url,
		type: driveFile.webpublicType ?? driveFile.type,
	}).then(x => Emojis.findOneByOrFail(x.identifiers[0]));

	console.debug('copied =', copied);

	await db.queryResultCache?.remove(['meta_emojis']);

	publishBroadcastStream('emojiAdded', {
		emoji: await Emojis.pack(copied.id),
	});

	return {
		id: copied.id,
	};
});
