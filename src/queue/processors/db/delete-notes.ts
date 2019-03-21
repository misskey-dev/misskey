import * as Bull from 'bull';

import { queueLogger } from '../../logger';
import Note from '../../../models/note';
import deleteNote from '../../../services/note/delete';
import User from '../../../models/user';

const logger = queueLogger.createSubLogger('delete-notes');

export async function deleteNotes(job: Bull.Job, done: any): Promise<void> {
	logger.info(`Deleting notes of ${job.data.user.id} ...`);

	const user = await Users.findOne({
		id: new mongo.ObjectID(job.data.user.id.toString())
	});

	let deletedCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const notes = await Note.find({
			userId: user.id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				id: 1
			}
		});

		if (notes.length === 0) {
			ended = true;
			job.progress(100);
			break;
		}

		cursor = notes[notes.length - 1].id;

		for (const note of notes) {
			await deleteNote(user, note, true);
			deletedCount++;
		}

		const total = await Note.count({
			userId: user.id,
		});

		job.progress(deletedCount / total);
	}

	logger.succ(`All notes (${deletedCount}) of ${user.id} has been deleted.`);
	done();
}
