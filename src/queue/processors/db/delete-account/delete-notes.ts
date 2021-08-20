import * as Bull from 'bull';
import { MoreThan } from 'typeorm';
import { queueLogger } from '../../../logger';
import { Users, Notes } from '@/models/index';
import { DbUserJobData } from '@/queue/types';
import { Note } from '@/models/entities/note';
import { deleteAccountJobs } from '@/queue';

const logger = queueLogger.createSubLogger('delete-account:delete-notes');

export async function deleteAccount_deleteNotes(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Deleting notes of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	let deletedNotesCount = 0;
	let cursor: Note['id'] | null = null;

	while (true) {
		const notes = await Notes.find({
			where: {
				userId: user.id,
				...(cursor ? { id: MoreThan(cursor) } : {})
			},
			take: 100,
			order: {
				id: 1
			}
		});

		if (notes.length === 0) {
			job.progress(100);
			break;
		}

		cursor = notes[notes.length - 1].id;

		await Notes.delete(notes.map(note => note.id));

		deletedNotesCount++;

		const total = await Notes.count({
			userId: user.id,
		});

		job.progress(deletedNotesCount / total);
	}

	logger.succ(`All of notes deleted`);

	deleteAccountJobs.createDeleteFilesJob(job.data.user);

	done();
}
