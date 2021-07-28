import * as Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'fs';

import { queueLogger } from '../../logger';
import addFile from '../../../services/drive/add-file';
import dateFormat = require('dateformat');
import { Users, Notes, Polls } from '../../../models';
import { MoreThan } from 'typeorm';
import { Note } from '../../../models/entities/note';
import { Poll } from '../../../models/entities/poll';
import { DbUserJobData } from '@/queue/types';

const logger = queueLogger.createSubLogger('export-notes');

export async function exportNotes(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting notes of ${job.data.user.id} ...`);

	const user = await Users.findOne(job.data.user.id);
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	const stream = fs.createWriteStream(path, { flags: 'a' });

	await new Promise<void>((res, rej) => {
		stream.write('[', err => {
			if (err) {
				logger.error(err);
				rej(err);
			} else {
				res();
			}
		});
	});

	let exportedNotesCount = 0;
	let cursor: any = null;

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

		for (const note of notes) {
			let poll: Poll | undefined;
			if (note.hasPoll) {
				poll = await Polls.findOneOrFail({ noteId: note.id });
			}
			const content = JSON.stringify(serialize(note, poll));
			await new Promise<void>((res, rej) => {
				stream.write(exportedNotesCount === 0 ? content : ',\n' + content, err => {
					if (err) {
						logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
			exportedNotesCount++;
		}

		const total = await Notes.count({
			userId: user.id,
		});

		job.progress(exportedNotesCount / total);
	}

	await new Promise<void>((res, rej) => {
		stream.write(']', err => {
			if (err) {
				logger.error(err);
				rej(err);
			} else {
				res();
			}
		});
	});

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'notes-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.json';
	const driveFile = await addFile(user, path, fileName, null, null, true);

	logger.succ(`Exported to: ${driveFile.id}`);
	cleanup();
	done();
}

function serialize(note: Note, poll: Poll | null = null): any {
	return {
		id: note.id,
		text: note.text,
		createdAt: note.createdAt,
		fileIds: note.fileIds,
		replyId: note.replyId,
		renoteId: note.renoteId,
		poll: poll,
		cw: note.cw,
		viaMobile: note.viaMobile,
		visibility: note.visibility,
		visibleUserIds: note.visibleUserIds,
		localOnly: note.localOnly
	};
}
