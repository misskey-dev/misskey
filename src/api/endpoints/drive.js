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
	// Calculate drive usage
	const usage = ((await DriveFile
		.aggregate([
			{ $match: { user_id: user._id } },
			{ $project: {
				datasize: true
			}},
			{ $group: {
				_id: null,
				usage: { $sum: '$datasize' }
			}}
		]))[0] || {
			usage: 0
		}).usage;

	res({
		capacity: user.drive_capacity,
		usage: usage
	});
});
