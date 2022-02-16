import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import ms from 'ms';
import { uploadFromUrl } from '@/services/drive/upload-from-url';
import define from '../../../define';
import { DriveFiles } from '@/models/index';
import { publishMainStream } from '@/services/stream';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits';

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	requireCredential: true,

	kind: 'write:drive',

	params: {
		type: 'object',
		properties: {
			url: { type: 'string', },
			folderId: { type: 'string', format: 'misskey:id', nullable: true, },
			isSensitive: { type: 'boolean', default: false, },
			comment: { type: 'string', nullable: true, maxLength: 512, },
			marker: { type: 'string', nullable: true, },
			force: { type: 'boolean', default: false, },
		},
		required: ['url'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment }).then(file => {
		DriveFiles.pack(file, { self: true }).then(packedFile => {
			publishMainStream(user.id, 'urlUploadFinished', {
				marker: ps.marker,
				file: packedFile,
			});
		});
	});
});
