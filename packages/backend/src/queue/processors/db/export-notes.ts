import Bull from 'bull';
import * as fs from 'node:fs';

import { queueLogger } from '../../logger.js';
import { addFile } from '@/services/drive/add-file.js';
import { format as dateFormat } from 'date-fns';
import { Users, Notes, Polls } from '@/models/index.js';
import { MoreThan } from 'typeorm';
import { Note } from '@/models/entities/note.js';
import { Poll } from '@/models/entities/poll.js';
import { DbUserJobData } from '@/queue/types.js';
import { createTemp } from '@/misc/create-temp.js';

const logger = queueLogger.createSubLogger('export-notes');

export async function exportNotes(job: Bull.Job<DbUserJobData>, done: any): Promise<void> {
	logger.info(`Exporting notes of ${job.data.user.id} ...`);

	const user = await Users.findOneBy({ id: job.data.user.id });
	if (user == null) {
		done();
		return;
	}

	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		const stream = fs.createWriteStream(path, { flags: 'a' });

		const write = (text: string): Promise<void> => {
			return new Promise<void>((res, rej) => {
				stream.write(text, err => {
					if (err) {
						logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
		};

		await write('[');

		let exportedNotesCount = 0;
		let cursor: Note['id'] | null = null;

		while (true) {
			const notes = await Notes.find({
				where: {
					userId: user.id,
					...(cursor ? { id: MoreThan(cursor) } : {}),
				},
				take: 100,
				order: {
					id: 1,
				},
			}) as Note[];

			if (notes.length === 0) {
				job.progress(100);
				break;
			}

			cursor = notes[notes.length - 1].id;

			for (const note of notes) {
				let poll: Poll | undefined;
				if (note.hasPoll) {
					poll = await Polls.findOneByOrFail({ noteId: note.id });
				}
				const content = JSON.stringify(serialize(note, poll));
				const isFirst = exportedNotesCount === 0;
				await write(isFirst ? content : ',\n' + content);
				exportedNotesCount++;
			}

			const total = await Notes.countBy({
				userId: user.id,
			});

			job.progress(exportedNotesCount / total);
		}

		await write(']');

		stream.end();
		logger.succ(`Exported to: ${path}`);

		const fileName = 'notes-' + dateFormat(new Date(), 'yyyy-MM-dd-HH-mm-ss') + '.json';
		const driveFile = await addFile({ user, path, name: fileName, force: true });

		logger.succ(`Exported to: ${driveFile.id}`);
	} finally {
		cleanup();
	}

	done();
}

function serialize(note: Note, poll: Poll | null = null): Record<string, unknown> {
	return {
		id: note.id,
		text: note.text,
		createdAt: note.createdAt,
		fileIds: note.fileIds,
		replyId: note.replyId,
		renoteId: note.renoteId,
		poll: poll,
		cw: note.cw,
		visibility: note.visibility,
		visibleUserIds: note.visibleUserIds,
		localOnly: note.localOnly,
	};
}
