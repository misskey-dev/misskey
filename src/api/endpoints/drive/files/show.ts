/**
 * Module dependencies
 */
import it from '../../../it';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';

/**
 * Show a file
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'file_id' parameter
	const [fileId, fileIdErr] = it(params.file_id).expect.id().required().qed();
	if (fileIdErr) return rej('invalid file_id param');

	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: fileId,
			user_id: user._id
		}, {
			fields: {
				data: false
			}
		});

	if (file === null) {
		return rej('file-not-found');
	}

	// Serialize
	res(await serialize(file, {
		detail: true
	}));
});
