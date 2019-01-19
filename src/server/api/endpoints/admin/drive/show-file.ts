import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import DriveFile from '../../../../../models/drive-file';
import { error } from '../../../../../prelude/promise';

export const meta = {
	requireCredential: true,
	requireModerator: true,

	params: {
		fileId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default define(meta, (ps, me) => DriveFile.findOne({ _id: ps.fileId })
	.then(x =>
		!x ? error('file not found') :
		x));
