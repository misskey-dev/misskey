import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240',
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
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			userId: {
				type: 'string',
				optional: false, nullable: true,
				format: 'id',
				example: 'xxxxxxxxxx',
			},
			userHost: {
				type: 'string',
				optional: false, nullable: true,
				description: 'The local host is represented with `null`.',
			},
			md5: {
				type: 'string',
				optional: false, nullable: false,
				format: 'md5',
				example: '15eca7fba0480996e2245f5185bf39f2',
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
				example: 'lenna.jpg',
			},
			type: {
				type: 'string',
				optional: false, nullable: false,
				example: 'image/jpeg',
			},
			size: {
				type: 'number',
				optional: false, nullable: false,
				example: 51469,
			},
			comment: {
				type: 'string',
				optional: false, nullable: true,
			},
			blurhash: {
				type: 'string',
				optional: false, nullable: true,
			},
			properties: {
				type: 'object',
				optional: false, nullable: false,
				properties: {
					width: {
						type: 'number',
						optional: false, nullable: false,
						example: 1280,
					},
					height: {
						type: 'number',
						optional: false, nullable: false,
						example: 720,
					},
					avgColor: {
						type: 'string',
						optional: true, nullable: false,
						example: 'rgb(40,65,87)',
					},
				},
			},
			storedInternal: {
				type: 'boolean',
				optional: false, nullable: true,
				example: true,
			},
			url: {
				type: 'string',
				optional: false, nullable: true,
				format: 'url',
			},
			thumbnailUrl: {
				type: 'string',
				optional: false, nullable: true,
				format: 'url',
			},
			webpublicUrl: {
				type: 'string',
				optional: false, nullable: true,
				format: 'url',
			},
			accessKey: {
				type: 'string',
				optional: false, nullable: false,
			},
			thumbnailAccessKey: {
				type: 'string',
				optional: false, nullable: false,
			},
			webpublicAccessKey: {
				type: 'string',
				optional: false, nullable: false,
			},
			uri: {
				type: 'string',
				optional: false, nullable: true,
			},
			src: {
				type: 'string',
				optional: false, nullable: true,
			},
			folderId: {
				type: 'string',
				optional: false, nullable: true,
				format: 'id',
				example: 'xxxxxxxxxx',
			},
			isSensitive: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			isLink: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				fileId: { type: 'string', format: 'misskey:id' },
			},
			required: ['fileId'],
		},
		{
			properties: {
				url: { type: 'string' },
			},
			required: ['url'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const file = ps.fileId ? await DriveFiles.findOneBy({ id: ps.fileId }) : await DriveFiles.findOne({
		where: [{
			url: ps.url,
		}, {
			thumbnailUrl: ps.url,
		}, {
			webpublicUrl: ps.url,
		}],
	});

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	return file;
});
