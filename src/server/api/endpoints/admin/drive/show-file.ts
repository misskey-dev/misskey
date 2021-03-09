import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles } from '../../../../../models';

export const meta = {
	tags: ['admin'],

	requireCredential: true as const,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.optional.type(ID),
		},

		url: {
			validator: $.optional.str,
		},
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'caf3ca38-c6e5-472e-a30c-b05377dcc240'
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
				description: 'The unique identifier for this Drive file.',
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'date-time',
				description: 'The date that the Drive file was created on Misskey.'
			},
			userId: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'id',
				description: 'Owner ID of this Drive file.',
				example: 'xxxxxxxxxx',
			},
			userHost: {
				type: 'string' as const,
				optional: false as const, nullable: true as const
			},
			md5: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'md5',
				description: 'The MD5 hash of this Drive file.',
				example: '15eca7fba0480996e2245f5185bf39f2'
			},
			name: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The file name with extension.',
				example: 'lenna.jpg'
			},
			type: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The MIME type of this Drive file.',
				example: 'image/jpeg'
			},
			size: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				description: 'The size of this Drive file. (bytes)',
				example: 51469
			},
			comment: {
				type: 'string' as const,
				optional: false as const, nullable: true as const
			},
			blurhash: {
				type: 'string' as const,
				optional: false as const, nullable: true as const
			},
			properties: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				properties: {
					width: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						example: 1280
					},
					height: {
						type: 'number' as const,
						optional: false as const, nullable: false as const,
						example: 720
					},
					avgColor: {
						type: 'string' as const,
						optional: true as const, nullable: false as const,
						example: 'rgb(40,65,87)'
					}
				}
			},
			storedInternal: {
				type: 'boolean' as const,
				optional: false as const, nullable: true as const,
				description: 'Indicates whether this file is stored in the same location as Misskey itself',
				example: true
			},
			url: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
				description: 'The URL of this Drive file.',
			},
			thumbnailUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
				description: 'The thumbnail URL of this Drive file.',
			},
			webpublicUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
				description: 'The public URL of this Drive file.',
			},
			accessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Access key to access this file'
			},
			thumbnailAccessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Access key to access this file for thumbnail'
			},
			webpublicAccessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'Access key to access this file for webpublic'
			},
			uri: {
				type: 'string' as const,
				optional: false as const, nullable: true as const
			},
			src: {
				type: 'string' as const,
				optional: false as const, nullable: true as const
			},
			folderId: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'id',
				description: 'The parent folder ID of this Drive file.',
				example: 'xxxxxxxxxx',
			},
			isSensitive: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				description: 'Whether this Drive file is sensitive.',
			},
			isLink: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const
			}
		}
	}
};

export default define(meta, async (ps, me) => {
	const file = ps.fileId ? await DriveFiles.findOne(ps.fileId) : await DriveFiles.findOne({
		where: [{
			url: ps.url
		}, {
			thumbnailUrl: ps.url
		}, {
			webpublicUrl: ps.url
		}]
	});

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	return file;
});
