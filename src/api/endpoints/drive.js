'use strict';

/**
 * Module dependencies
 */
import DriveFile from '../models/drive-file';

/**
 * Get drive information
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Fetch all files to calculate drive usage
	const files = await DriveFile
		.find({ user_id: user._id }, {
			datasize: true,
			_id: false
		});

	// Calculate drive usage (in byte)
	const usage = files.map(file => file.datasize).reduce((x, y) => x + y, 0);

	res({
		capacity: user.drive_capacity,
		usage: usage
	});
});
