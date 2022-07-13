import ms from 'ms';
import { uploadFromUrl } from '@/services/drive/upload-from-url.js';
import { DriveFiles } from '@/models/index.js';
import { publishMainStream } from '@/services/stream.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import define from '../../../define.js';

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	description: 'Request the server to download a new drive file from the specified URL.',

	requireCredential: true,

	kind: 'write:drive',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		isSensitive: { type: 'boolean', default: false },
		comment: { type: 'string', nullable: true, maxLength: 512, default: null },
		marker: { type: 'string', nullable: true, default: null },
		force: { type: 'boolean', default: false },
	},
	required: ['url'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, _1, _2, _3, ip, headers) => {
	uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
		DriveFiles.pack(file, { self: true }).then(packedFile => {
			publishMainStream(user.id, 'urlUploadFinished', {
				marker: ps.marker,
				file: packedFile,
			});
		});
	});
});
