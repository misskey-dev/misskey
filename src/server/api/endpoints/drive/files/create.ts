const ms = require('ms');
import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import { validateFileName, pack } from '../../../../../models/drive-file';
import create from '../../../../../services/drive/add-file';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'ドライブにファイルをアップロードします。',
		'en-US': 'Upload a file to drive.'
	},

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 120
	},

	requireFile: true,

	kind: 'drive-write',

	params: {
		folderId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},

		isSensitive: {
			validator: $.or($.bool, $.str).optional,
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		},

		force: {
			validator: $.or($.bool, $.str).optional,
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
			desc: {
				'ja-JP': 'true にすると、同じハッシュを持つファイルが既にアップロードされていても強制的にファイルを作成します。',
			}
		}
	}
};

const name = (original: string) => nameResolver((original || '').trim());

const nameResolver = (original: string) =>
	!original.length || original === 'blob' ? null :
	!validateFileName(original) ? error('invalid name') :
	original;

export default define(meta, (ps, user, _, file, cleanup) => create(user, file.path, name(file.originalname), null, ps.folderId, ps.force, false, null, null, ps.isSensitive)
	.then(
		x => (cleanup(), pack(x, { self: true })),
		x => (console.error(x), cleanup(), error(x))));
