/**
 * Module dependencies
 */
import $ from 'cafy';
import Note from '../../../../../models/note';
import Reaction from '../../../../../models/note-reaction';

/**
 * Aggregate reactions of a note
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).id().$;
	if (noteIdErr) return rej('invalid noteId param');

	// Lookup note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));

	const reactions = await Reaction
		.find({
			noteId: note._id,
			$or: [
				{ deletedAt: { $exists: false } },
				{ deletedAt: { $gt: startTime } }
			]
		}, {
			sort: {
				_id: -1
			},
			fields: {
				_id: false,
				noteId: false
			}
		});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		let day = new Date(new Date().setDate(new Date().getDate() - i));
		day = new Date(day.setMilliseconds(999));
		day = new Date(day.setSeconds(59));
		day = new Date(day.setMinutes(59));
		day = new Date(day.setHours(23));
		// day = day.getTime();

		const count = reactions.filter(r =>
			r.createdAt < day && (r.deletedAt == null || r.deletedAt > day)
		).length;

		graph.push({
			date: {
				year: day.getFullYear(),
				month: day.getMonth() + 1, // In JavaScript, month is zero-based.
				day: day.getDate()
			},
			count: count
		});
	}

	res(graph);
});
