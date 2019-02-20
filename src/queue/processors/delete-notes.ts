import * as bq from 'bee-queue';
import * as mongo from 'mongodb';

import { queueLogger } from '../logger';
import Note from '../../models/note';
import deleteNote from '../../services/note/delete';
import User from '../../models/user';

const logger = queueLogger.createSubLogger('delete-notes');

export async function deleteNotes(job: bq.Job, done: any): Promise<void> {
	logger.info(`Deleting notes of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	let deletedCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const notes = await Note.find({
			userId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (notes.length === 0) {
			ended = true;
			if (job.reportProgress) job.reportProgress(100);
			break;
		}

		cursor = notes[notes.length - 1]._id;

		for (const note of notes) {
			await deleteNote(user, note, true);
			deletedCount++;
		}

		const total = await Note.count({
			userId: user._id,
		});

		if (job.reportProgress) job.reportProgress(deletedCount / total);
	}

	logger.succ(`All notes (${deletedCount}) of ${user._id} has been deleted.`);
	done();
}
