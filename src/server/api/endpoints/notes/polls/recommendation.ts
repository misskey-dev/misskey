/**
 * Module dependencies
 */
import $ from 'cafy';
import Vote from '../../../../../models/poll-vote';
import Note, { pack } from '../../../../../models/note';

/**
 * Get recommended polls
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Get votes
	const votes = await Vote.find({
		userId: user._id
	}, {
		fields: {
			_id: false,
			noteId: true
		}
	});

	const nin = votes && votes.length != 0 ? votes.map(v => v.noteId) : [];

	const notes = await Note
		.find({
			_id: {
				$nin: nin
			},
			userId: {
				$ne: user._id
			},
			poll: {
				$exists: true,
				$ne: null
			}
		}, {
			limit: limit,
			skip: offset,
			sort: {
				_id: -1
			}
		});

	// Serialize
	res(await Promise.all(notes.map(async note =>
		await pack(note, user, { detail: true }))));
});
