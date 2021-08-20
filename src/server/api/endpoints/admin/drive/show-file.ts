import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles } from '@/models/index';

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
				example: 'xxxxxxxxxx',
			},
			createdAt: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'date-time',
			},
			userId: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'id',
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
				example: '15eca7fba0480996e2245f5185bf39f2'
			},
			name: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				example: 'lenna.jpg'
			},
			type: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				example: 'image/jpeg'
			},
			size: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
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
				example: true
			},
			url: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
			},
			thumbnailUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
			},
			webpublicUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
				format: 'url',
			},
			accessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			thumbnailAccessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			webpublicAccessKey: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
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
				example: 'xxxxxxxxxx',
			},
			isSensitive: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
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
