import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import define from '../../../define';
import DriveFile from '../../../../../models/drive-file';

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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const file = await DriveFile.findOne({
		_id: ps.fileId
	});

	if (file == null) {
		return rej('file not found');
	}

	res(file);
}));
